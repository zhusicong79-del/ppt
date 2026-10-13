# SmartX Content Studio Demo

企业案例与产品介绍的 HTML 内容工作台。使用 Node.js 22+，无第三方运行依赖。

```sh
npm start
# 默认端口 3000，PORT 可覆盖
npm test
```

## 演示账号

- `demo@smartx.com`：SmartX 演示组织
- `demo@partner.com`：合作伙伴演示组织
- 密码均为 `Demo2026!`

提供内容搜索与分类、模块自由拼接、标题/正文/版式编辑、页面拖动排序、复制/删除、预览、租户文稿保存、离线 HTML 导出。浏览器打印导出的 HTML 可生成 PDF。

服务端通过 HttpOnly 会话识别账号，按租户保存到忽略的 `.data/tenant-<id>.json`；前端不能指定其他租户。退出会销毁会话，会话过期时间 24 小时。演示账号属于同一租户时应共享内容空间。

Google Drive 文件和 CRM 客户均为明确标注的模拟数据。导入演示 PPT 会加入预设模块，**不解析真实 PPTX**。不需要公司账号、凭据或外部 API。

正式 Google Drive 接入需配置公司 Google OAuth 客户端、最小只读权限、允许的共享盘、服务端安全存储授权以及 PPTX 转换服务。CRM 接入需明确供应商、接口、授权及租户映射。上线前应替换演示账号为公司 SSO，使用持久化会话和数据库、HTTPS、安全审计及权限体系。当前文件存储、内存会话和公开演示密码仅用于 demo，不适合生产。

视觉配色参考 https://www.smartx.com/ 官网样式中的 #00122e、#0080ff、#009dff 与 #f2f5fa；文字标识与内容为演示重建，不代表正式品牌素材或客户案例。

验证：`npm test` 验证未登录拒绝、错误密码、登录、持久保存、两个租户隔离、输入校验、模拟接口及退出失效。浏览器冒烟验证登录、模块添加、编辑与保存后刷新、模拟 Drive 导入、CRM 关联、HTML 下载、预览和移动端渲染。

## 部署

提供 `Dockerfile` 和 `render.yaml`。Render Blueprint 可读取本仓库配置创建 Node Web Service；仓库需要先推送代码，并由拥有仓库访问权限的 Render 账号授权导入。没有部署平台授权时不能创建公网地址。

Render 免费服务上的本地文件不是持久存储：重启、重新部署时保存的演示可能丢失。需要长期保存时应改用持久磁盘或数据库。当前会话在内存中，服务重启后需重新登录。当前部署只适合使用演示数据，不要上传公司机密。

Docker 自托管示例：

```sh
docker build -t smartx-studio .
docker run -d --name smartx-studio -p 3000:3000 -v smartx-studio-data:/app/.data smartx-studio
```

公网部署应由托管平台或反向代理提供 HTTPS。
