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

默认代理目标为 `http://127.0.0.1:8080`（见 `vite.config.ts`），开发端口使用 Vite 默认值。**如果后端就运行在 8080 端口，直接 `npm run dev` 即可，无需任何额外配置。**

仅当后端运行在其他端口（下面以 10020 为例）、需要覆盖时才使用以下方式，请将示例值替换为你实际的端口：

macOS / Linux / Git Bash：

```bash
# 覆盖后端代理目标端口为 10020，同时覆盖前端开发端口为 10029
VITE_PROXY_TARGET=http://127.0.0.1:10020 npm run dev -- --port 10029
```

Windows PowerShell：

```powershell
# 覆盖后端代理目标端口为 10020，同时覆盖前端开发端口为 10029
$env:VITE_PROXY_TARGET="http://127.0.0.1:10020"; npm run dev -- --port 10029
```

或者，将环境变量写入项目根目录的 `.env.local` 文件（适合本地固定配置，Vite 会自动加载，该文件通常已被 Git 忽略）：

```dotenv
VITE_PROXY_TARGET=http://127.0.0.1:10020
```

之后启动只需指定端口：

```bash
npm run dev -- --port 10029
```

> 上述命令中的 `10020`、`10029` 均为示例值，请替换为你实际的后端代理端口和前端开发端口。

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
