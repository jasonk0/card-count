# 会员卡计数管理系统 (Card Count)

一个用于管理会员卡、记录使用情况并分析成本的应用程序。

## 功能特点

- 会员卡管理：创建、编辑、删除会员卡
- 使用记录管理：记录会员卡的使用情况和销售情况
- 数据分析：计算单次使用成本、分析价值等
- 会员卡暂停：支持会员卡暂停和恢复功能
- 数据导入导出：支持将数据导出为JSON文件并可导入

## 项目结构

```
card-count/
├── public/           # 静态资源
├── server/           # 后端服务
│   ├── data/         # 数据存储文件夹
│   ├── uploads/      # 上传文件临时存储
│   ├── index.js      # 服务器入口文件
│   └── package.json  # 后端依赖
└── src/              # 前端源代码
    ├── api/          # API接口
    ├── components/   # 通用组件
    ├── hooks/        # 自定义钩子
    ├── pages/        # 页面组件
    ├── store/        # 存储相关
    ├── types/        # 类型定义
    └── App.tsx       # 应用主组件
```

## 安装与运行

### 前端

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 构建生产版本
npm run build
```

### 后端

```bash
# 进入服务器目录
cd server

# 安装依赖
npm install

# 启动服务器
npm run dev  # 开发模式，使用nodemon
# 或
npm start    # 生产模式
```

## API接口

服务器运行在 `http://localhost:5000`，提供以下接口：

### 会员卡

- `GET /api/cards` - 获取所有会员卡
- `GET /api/cards/:id` - 获取单个会员卡
- `POST /api/cards` - 创建会员卡
- `PUT /api/cards/:id` - 更新会员卡
- `PUT /api/cards` - 批量更新会员卡
- `DELETE /api/cards/:id` - 删除会员卡

### 使用记录

- `GET /api/records` - 获取所有使用记录
- `GET /api/cards/:id/records` - 获取特定卡的使用记录
- `POST /api/records` - 创建使用记录
- `POST /api/records/batch` - 批量创建使用记录
- `PUT /api/records/:id` - 更新使用记录
- `PUT /api/records` - 批量更新使用记录
- `DELETE /api/records/:id` - 删除使用记录
- `DELETE /api/records` - 批量删除使用记录

### 导入导出

- `GET /api/export` - 导出所有数据
- `POST /api/import` - 导入数据 (multipart/form-data)

## 数据备份

建议定期使用导出功能备份您的数据。导出的JSON文件包含所有会员卡和使用记录的完整信息。

## Docker部署

本项目支持使用Docker进行部署，包含了前端和后端的完整环境。

### 前提条件
- 安装Docker和Docker Compose
- 确保5000端口未被占用

### 部署步骤

1. 克隆项目
```bash
git clone <项目仓库地址>
cd card-count
```

2. 使用Docker Compose构建和启动
```bash
docker-compose up -d --build
```

3. 访问系统
打开浏览器访问: `http://localhost:5000`

### 数据持久化

系统数据存储在以下目录中，并已配置持久化：
- `./data`: 会员卡和使用记录数据
- `./uploads`: 上传的文件

### 维护命令

- 查看日志
```bash
docker-compose logs -f
```

- 重启服务
```bash
docker-compose restart
```

- 停止服务
```bash
docker-compose down
```

- 更新后重新部署
```bash
git pull
docker-compose up -d --build
```
