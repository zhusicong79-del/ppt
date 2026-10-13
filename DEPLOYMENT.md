# 公司模板与真实 Drive 部署

公司原始附件只放在忽略的 `.data/tenant-1/templates`，不提交 GitHub。原 Node Demo 不包含 LibreOffice；PDF、模板转换及保真 HTML 导出需要新的 Docker 服务。

1. 在现有 Render Blueprint 中同步最新配置，创建 `smartx-solution-studio` Docker 服务。`render.yaml` 保留旧 Demo 服务，不删除它。也可用 New → Web Service，关联本仓库，选择 Docker。
2. 安全填写 `STUDIO_ADMIN_EMAIL` 和至少 12 字符的 `STUDIO_ADMIN_PASSWORD`。配置后公开演示账号自动停用。不要把密码发到聊天或提交进 Git。
3. 服务 Live 后用专用账号登录。在右侧“公司模板”中导入两份原始附件（30 页和 171 页）。云环境当前解析结果不会自动迁移到 Render。
4. 新建与文字生成时选择正式模板的原始页面，或通过素材页的“套用”按钮给现有方案页面指定正式版式。旧演示页面没有绑定模板时，正式 PDF/PPTX/HTML 导出会要求补充模板。原始文件、母版、背景、图片及未修改文本保留；编辑文本使用源文本样式。
5. 编辑原始文本或侧栏标题/正文后，点击“更新模板预览”获得权威渲染。输入过程的覆盖层只是编辑反馈；PDF、HTML 与 PPTX 导出都会重新生成。PDF 和 HTML 都基于生成 PPTX 的 LibreOffice 渲染；HTML 为内嵌图片的离线演示快照，继续编辑请回到工作台。PPTX 中原始元素和新增拓扑形状可在 PowerPoint 编辑。

免费 Render 的文件系统是临时的，模板、方案和 Drive 授权可能在重新部署时丢失。正式使用需要持久磁盘挂载 `/app/.data`（需要对应 Render 付费能力，请自行选择），或迁移到对象存储和数据库；代码不会自动升级计费方案。两份原文件共约 35 MB，全量预览和导出较耗内存，免费实例资源不足时需调整实例规格。

## Google Drive 授权

目标文件夹：`https://drive.google.com/drive/u/0/folders/1ALxuly8cCnhqvv5SfVrCRmQBdFehN6XP`。

1. 在公司 Google Cloud 项目启用 Google Drive API，配置 OAuth 同意屏幕（优先 Internal）；建立 Web application OAuth 客户端。
2. 授权回调地址精确填为 `https://你的Render域名/api/drive/callback`。
3. 在 Render 安全配置 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`PUBLIC_BASE_URL=https://你的Render域名`。Blueprint 已生成 `STUDIO_ENCRYPTION_KEY`；自行创建服务时需另行安全设置该随机密钥，并在重启时保持一致。不要将这些值发到聊天。
4. 登录工作台 → 管理来源 → 保存文件夹关联 → 连接 Google 账号，由有公司文件夹权限的账号授权 Drive 只读访问。
5. 点击同步文件夹与子目录，再刷新同步状态。同步递归获取 PPTX 和 Google Slides（后者导出为 PPTX），根据 modifiedTime 跳过未变更文件，转换为页面素材。原 Drive 内容不会被修改。同步导入的材料不会自动成为正式模板；新建/生成的正式模板仍来自手动导入的两份文件。

OAuth refresh token 以 AES-256-GCM 加密保存在对应租户目录，access token 只用于服务端 HTTPS 请求。同步是手动启动的后台增量任务，**尚未实现自动定时任务、删除源文件回收及多用户 Google 权限映射**。同步的新版本保留独立模板 ID，旧方案的原始版式保持可用。

当前云环境未取得公司 Drive OAuth 授权，因此实际公司列表、下载和同步尚未验证；文件夹关联保存与授权前拒绝同步已验证。

## 字体与验证

附件主要使用 Microsoft Yahei。PPTX 导出保留源字体声明；PDF 和 HTML 使用渲染环境已安装字体，Docker 默认 Noto CJK，缺少微软雅黑时会替代，无法保证与安装了原字体的 Microsoft PowerPoint 逐像素一致。若公司需要严格字体效果，应在许可允许的前提下给渲染服务提供原字体。

本地验证：`npm test`；安装两份私有模板后运行 `python3 scripts/test_presentations.py .data/tenant-1`。包含跨租户隔离、Drive 关联/授权状态区分、两份原模板跨文件导出、PPTX 原生可编辑文本、PDF 页数与未修改页面像素一致性。本地 Docker 镜像已构建，并在 512 MB 限制下验证小型跨模板 PPTX/PDF 导出；Render 端尚未部署验证，完整 201 页导入的资源需求还需要在线确认。
