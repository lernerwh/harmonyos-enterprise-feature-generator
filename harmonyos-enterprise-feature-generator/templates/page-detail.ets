/**
 * 详情页模板
 * 功能：展示详细信息、操作按钮（编辑、删除）
 */

import { {{ServiceName}} } from '../services/{{ServiceName}}';
import { Logger } from '../utils/logger';
import { ErrorProcessor } from '../utils/error-processor';
import { PermissionCheck } from '../utils/permission-check';
import router from '@ohos.router';

@Entry
@Component
struct {{DetailPageName}} {
  @State dataId: string = '';
  @State dataDetail: {{DataType}} | null = null;
  @State isLoading: boolean = true;
  @State showDeleteDialog: boolean = false;

  private {{serviceName}}: {{ServiceName}} = new {{ServiceName}}();
  private logger: Logger = new Logger('{{DetailPageName}}');

  aboutToAppear() {
    const params = router.getParams() as Record<string, string>;
    this.dataId = params?.id || '';
    this.logger.info(`详情页初始化，ID：${this.dataId}`);
    this.loadDetail();
  }

  /**
   * 加载详情
   */
  async loadDetail() {
    if (!this.dataId) {
      ErrorProcessor.showError(1001, '参数错误');
      return;
    }

    try {
      this.isLoading = true;
      this.logger.info(`加载详情，ID：${this.dataId}`);

      const detail = await this.{{serviceName}}.getDetail(this.dataId);
      this.dataDetail = detail;

    } catch (error) {
      this.logger.error('加载详情失败', error);
      ErrorProcessor.processError(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 编辑
   */
  onEdit() {
    this.logger.info(`点击编辑，ID：${this.dataId}`);
    router.pushUrl({
      url: 'pages/{{EditPageName}}',
      params: { id: this.dataId }
    });
  }

  /**
   * 删除
   */
  async onDelete() {
    try {
      this.logger.info(`删除数据，ID：${this.dataId}`);
      await this.{{serviceName}}.delete(this.dataId);
      this.logger.info('删除成功');
      router.back();
    } catch (error) {
      this.logger.error('删除失败', error);
      ErrorProcessor.processError(error);
    }
  }

  /**
   * 返回
   */
  onBack() {
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
          .onClick(() => this.onBack())

        Text('详情')
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

      // 内容区域
      if (this.isLoading) {
        Column() {
          LoadingProgress()
            .width(40)
            .height(40)
            .color('#007AFF')
        }
        .width('100%')
        .layoutWeight(1)
      } else if (this.dataDetail) {
        Scroll() {
          Column() {
            // 详情内容
            this.DetailItemBuilder('字段1', this.dataDetail.{{Field1}})
            this.DetailItemBuilder('字段2', this.dataDetail.{{Field2}})
            this.DetailItemBuilder('字段3', this.dataDetail.{{Field3}})
            // 添加更多字段...
          }
          .width('100%')
          .padding({ top: 12, bottom: 12 })
        }
        .width('100%')
        .layoutWeight(1)
        .backgroundColor('#f5f5f5')
      }

      // 底部操作按钮
      if (this.dataDetail) {
        Row() {
          Button('删除')
            .type(ButtonType.Normal)
            .backgroundColor('#fff')
            .fontColor('#FF3B30')
            .border({ width: 1, color: '#FF3B30' })
            .layoutWeight(1)
            .onClick(() => {
              this.showDeleteDialog = true;
            })

          Button('编辑')
            .type(ButtonType.Normal)
            .backgroundColor('#007AFF')
            .fontColor('#fff')
            .layoutWeight(1)
            .margin({ left: 12 })
            .onClick(() => this.onEdit())
        }
        .width('100%')
        .padding(16)
        .backgroundColor('#fff')
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#fff')

    // 删除确认弹窗
    if (this.showDeleteDialog) {
      AlertDialog.show({
        title: '确认删除',
        message: '删除后无法恢复，是否继续？',
        primaryButton: {
          value: '取消',
          action: () => {
            this.showDeleteDialog = false;
          }
        },
        secondaryButton: {
          value: '删除',
          fontColor: '#FF3B30',
          action: () => {
            this.showDeleteDialog = false;
            this.onDelete();
          }
        }
      })
    }
  }

  @Builder
  DetailItemBuilder(label: string, value: string) {
    Row() {
      Text(label)
        .fontSize(14)
        .fontColor('#666')
        .width(100)

      Text(value || '-')
        .fontSize(14)
        .fontColor('#333')
        .layoutWeight(1)
    }
    .width('100%')
    .padding(16)
    .backgroundColor('#fff')
    .margin({ top: 8 })
    .borderRadius(8)
  }
}
