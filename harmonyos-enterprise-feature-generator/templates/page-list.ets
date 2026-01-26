/**
 * 列表页模板
 * 功能：支持搜索、筛选、分页、下拉刷新、上拉加载
 */

import { {{ServiceName}} } from '../services/{{ServiceName}}';
import { Logger } from '../utils/logger';
import { ErrorProcessor } from '../utils/error-processor';
import { PermissionCheck } from '../utils/permission-check';

@Entry
@Component
struct {{PageName}} {
  @State dataList: {{DataType}}[] = [];
  @State isLoading: boolean = false;
  @State isRefreshing: boolean = false;
  @State hasMore: boolean = true;
  @State currentPage: number = 1;
  @State pageSize: number = 20;
  @State searchText: string = '';

  private {{serviceName}}: {{ServiceName}} = new {{ServiceName}}();
  private logger: Logger = new Logger('{{PageName}}');

  aboutToAppear() {
    this.logger.info('页面初始化');
    this.checkPermissionAndLoad();
  }

  /**
   * 检查权限并加载数据
   */
  async checkPermissionAndLoad() {
    try {
      const hasPermission = await PermissionCheck.check('{{PermissionKey}}');
      if (!hasPermission) {
        ErrorProcessor.showError(2001, '无权限访问');
        return;
      }
      this.loadData();
    } catch (error) {
      this.logger.error('权限检查失败', error);
      ErrorProcessor.processError(error);
    }
  }

  /**
   * 加载数据
   */
  async loadData(isRefresh: boolean = false) {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      if (isRefresh) {
        this.isRefreshing = true;
        this.currentPage = 1;
        this.hasMore = true;
      }

      this.logger.info(`加载数据，页码：${this.currentPage}`);

      const response = await this.{{serviceName}}.getList({
        page: this.currentPage,
        pageSize: this.pageSize,
        search: this.searchText
      });

      if (isRefresh) {
        this.dataList = response.data;
      } else {
        this.dataList = [...this.dataList, ...response.data];
      }

      this.hasMore = response.data.length >= this.pageSize;
      this.currentPage++;

    } catch (error) {
      this.logger.error('加载数据失败', error);
      ErrorProcessor.processError(error);
    } finally {
      this.isLoading = false;
      this.isRefreshing = false;
    }
  }

  /**
   * 搜索
   */
  onSearch(value: string) {
    this.searchText = value;
    this.loadData(true);
  }

  /**
   * 下拉刷新
   */
  onRefresh() {
    this.logger.info('下拉刷新');
    this.loadData(true);
  }

  /**
   * 上拉加载更多
   */
  onLoadMore() {
    if (this.hasMore && !this.isLoading) {
      this.logger.info('上拉加载更多');
      this.loadData();
    }
  }

  /**
   * 点击列表项
   */
  onItemClick(item: {{DataType}}) {
    this.logger.info(`点击项目：${item.{{IdField}}}`);
    // 跳转到详情页
    router.pushUrl({
      url: 'pages/{{DetailPageName}}',
      params: { id: item.{{IdField}} }
    });
  }

  build() {
    Column() {
      // 搜索栏
      Search({ placeholder: '搜索' })
        .searchButton('搜索')
        .onSubmit((value: string) => this.onSearch(value))

      // 列表
      List({ scroller: new Scroller() }) {
        ForEach(this.dataList, (item: {{DataType}}, index: number) => {
          ListItem() {
            this.ItemBuilder(item)
          }
          .onClick(() => this.onItemClick(item))
        }, (item: {{DataType}}) => item.{{IdField}})

        // 加载更多提示
        if (this.hasMore) {
          ListItem() {
            Text('加载中...')
              .fontSize(14)
              .fontColor('#999')
              .width('100%')
              .textAlign(TextAlign.Center)
              .padding(10)
          }
        }
      }
      .width('100%')
      .layoutWeight(1)
      .onReachEnd(() => this.onLoadMore())
      .onRefresh(() => this.onRefresh())
      .refreshing(this.isRefreshing)

      // 空状态
      if (this.dataList.length === 0 && !this.isLoading) {
        Column() {
          Text('暂无数据')
            .fontSize(16)
            .fontColor('#999')
            .margin({ top: 100 })
        }
        .width('100%')
        .layoutWeight(1)
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#f5f5f5')
  }

  @Builder
  ItemBuilder(item: {{DataType}}) {
    Row() {
      // 左侧内容
      Column() {
        Text(item.{{DisplayField}})
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor('#333')

        // 其他字段
        // Text(item.{{OtherField}})
        //   .fontSize(14)
        //   .fontColor('#666')
        //   .margin({ top: 4 })
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      // 右侧箭头
      Image($r('app.media.ic_arrow_right'))
        .width(16)
        .height(16)
        .fillColor('#999')
    }
    .width('100%')
    .padding(16)
    .backgroundColor('#fff')
    .borderRadius(8)
    .margin({ left: 12, right: 12, top: 8 })
  }
}
