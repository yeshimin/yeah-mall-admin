# YeahMall Admin

YeahMall Admin 是 YeahMall 的统一管理后台，在同一个 Vue 3 工程中提供平台运营端和商家经营端。

项目基于 YeahBoot Admin 构建，复用其动态菜单、权限、页签和布局能力，并扩展商城运营与经营管理功能。

## 主要功能

### 平台后台

- 商家、店铺和会员管理
- 商品、订单、评价和售后管理
- 首页运营、秒杀、拼团和积分商城
- 支付通道、结算账户和商家结算

### 商家后台

- 店铺资料和营业管理
- 商品、SKU、规格和分类管理
- 订单、物流、退款和评价管理
- 优惠券、秒杀、拼团、客服和结算

## 技术栈

- Vue 3、TypeScript、Vite
- Vue Router、Pinia
- Element Plus、ECharts
- Axios、Sass

## 快速开始

```bash
npm ci
npm run dev
```

构建生产版本：

```bash
npm run build
```

## 相关项目

- `yeah-mall`：Java 后端
- `yeah-mall-admin`：平台后台与商家后台，本仓库
- `yeah-mall-app`：UniApp 消费者端

## License

许可证信息见 [LICENSE](./LICENSE)。
