/**
 * 编辑页模板
 * 功能：表单验证、保存/取消操作
 */

import { {{ServiceName}} } from '../services/{{ServiceName}}';
import { Logger } from '../utils/logger';
import { ErrorProcessor } from '../utils/error-processor';
import { PermissionCheck } from '../utils/permission-check';
import router from '@ohos.router';

@Entry
@Component
struct {{EditPageName}} {
  @State dataId: string = '';
  @State isEdit: boolean = false;
  @State isSaving: boolean = false;

  // 表单字段
  @State {{field1}}: string = '';
  @State {{field2}}: string = '';
  @State {{field3}}: string = '';

  // 验证错误提示
  @State field1Error: string = '';
  @State field2Error: string = '';
  @State field3Error: string = '';

  private {{serviceName}}: {{ServiceName}} = new {{ServiceName}}();
  private logger: Logger = new Logger('{{EditPageName}}');

  aboutToAppear() {
    const params = router.getParams() as Record<string, string>;
    this.dataId = params?.id || '';
    this.isEdit = !!this.dataId;

    if (this.isEdit) {
      this.logger.info(`编辑页初始化，ID：${this.dataId}`);
      this.loadData();
    } else {
      this.logger.info('新建页初始化');
    }
  }

  /**
   * 加载数据（编辑模式）
   */
  async loadData() {
    try {
      const detail = await this.{{serviceName}}.getDetail(this.dataId);
      this.{{field1}} = detail.{{Field1}} || '';
      this.{{field2}} = detail.{{Field2}} || '';
      this.{{field3}} = detail.{{Field3}} || '';
    } catch (error) {
      this.logger.error('加载数据失败', error);
      ErrorProcessor.processError(error);
    }
  }

  /**
   * 表单验证
   */
  validateForm(): boolean {
    let isValid = true;

    // 验证字段1
    if (!this.{{field1}}.trim()) {
      this.field1Error = '请输入字段1';
      isValid = false;
    } else {
      this.field1Error = '';
    }

    // 验证字段2
    if (!this.{{field2}}.trim()) {
      this.field2Error = '请输入字段2';
      isValid = false;
    } else {
      this.field2Error = '';
    }

    // 验证字段3（可选）
    // if (!this.{{field3}}.trim()) {
    //   this.field3Error = '请输入字段3';
    //   isValid = false;
    // } else {
    //   this.field3Error = '';
    // }

    return isValid;
  }

  /**
   * 保存
   */
  async onSave() {
    if (!this.validateForm()) {
      return;
    }

    try {
      this.isSaving = true;
      this.logger.info('保存数据');

      const formData = {
        {{Field1}}: this.{{field1}},
        {{Field2}}: this.{{field2}},
        {{Field3}}: this.{{field3}}
      };

      if (this.isEdit) {
        await this.{{serviceName}}.update(this.dataId, formData);
        this.logger.info('更新成功');
      } else {
        await this.{{serviceName}}.create(formData);
        this.logger.info('创建成功');
      }

      router.back();
    } catch (error) {
      this.logger.error('保存失败', error);
      ErrorProcessor.processError(error);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * 取消
   */
  onCancel() {
    this.logger.info('取消编辑');
    router.back();
  }

  build() {
    Column() {
      // 顶部导航栏
      Row() {
        Image($r('app.media.ic_back'))
          .width(24)
          .height(24)
          .fillColor('#333')
          .onClick(() => this.onCancel())

        Text(this.isEdit ? '编辑' : '新建')
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)

        // 占位，保持标题居中
        Row()
          .width(24)
          .height(24)
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })
      .backgroundColor('#fff')

      // 表单区域
      Scroll() {
        Column() {
          // 字段1
          Column() {
            Text('字段1 *')
              .fontSize(14)
              .fontColor('#666')
              .margin({ bottom: 8 })

            TextInput({ placeholder: '请输入字段1', text: this.{{field1}} })
              .onChange((value: string) => {
                this.{{field1}} = value;
                this.field1Error = '';
              })

            if (this.field1Error) {
              Text(this.field1Error)
                .fontSize(12)
                .fontColor('#FF3B30')
                .margin({ top: 4 })
            }
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
          .padding(16)
          .backgroundColor('#fff')
          .margin({ top: 8 })

          // 字段2
          Column() {
            Text('字段2 *')
              .fontSize(14)
              .fontColor('#666')
              .margin({ bottom: 8 })

            TextInput({ placeholder: '请输入字段2', text: this.{{field2}} })
              .onChange((value: string) => {
                this.{{field2}} = value;
                this.field2Error = '';
              })

            if (this.field2Error) {
              Text(this.field2Error)
                .fontSize(12)
                .fontColor('#FF3B30')
                .margin({ top: 4 })
            }
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
          .padding(16)
          .backgroundColor('#fff')
          .margin({ top: 8 })

          // 字段3
          Column() {
            Text('字段3')
              .fontSize(14)
              .fontColor('#666')
              .margin({ bottom: 8 })

            TextInput({ placeholder: '请输入字段3', text: this.{{field3}} })
              .onChange((value: string) => {
                this.{{field3}} = value;
                this.field3Error = '';
              })

            if (this.field3Error) {
              Text(this.field3Error)
                .fontSize(12)
                .fontColor('#FF3B30')
                .margin({ top: 4 })
            }
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
          .padding(16)
          .backgroundColor('#fff')
          .margin({ top: 8 })
        }
        .width('100%')
      }
      .width('100%')
      .layoutWeight(1)
      .backgroundColor('#f5f5f5')

      // 底部操作按钮
      Row() {
        Button('取消')
          .type(ButtonType.Normal)
          .backgroundColor('#fff')
          .fontColor('#666')
          .border({ width: 1, color: '#ddd' })
          .layoutWeight(1)
          .onClick(() => this.onCancel())

        Button('保存')
          .type(ButtonType.Normal)
          .backgroundColor('#007AFF')
          .fontColor('#fff')
          .enabled(!this.isSaving)
          .layoutWeight(1)
          .margin({ left: 12 })
          .onClick(() => this.onSave())
      }
      .width('100%')
      .padding(16)
      .backgroundColor('#fff')
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#fff')
  }
}
