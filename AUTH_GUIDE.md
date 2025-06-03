# 🔐 会员卡管理系统 - 认证功能使用指南

## 🎯 认证概述

系统现已添加完整的token认证机制，保护所有API接口和页面访问。

## 🔑 默认账户

- **用户名**: `admin`
- **密码**: `admin123`
- **角色**: 管理员
- **Token默认过期时间**: 99年

> ⚠️ **安全提醒**: 请在生产环境中立即修改默认密码！

## 🌐 Web界面使用

### 登录访问
1. 访问系统时会自动跳转到登录页面
2. 输入用户名和密码
3. **可选**: 点击"显示高级选项"自定义Token过期时间
4. 成功登录后会跳转到主界面
5. 点击侧边栏的"退出登录"可以退出

### Token管理页面
通过侧边栏的"Token管理"菜单进入：

**功能特性**:
- 📊 查看当前Token详细信息（用户、创建时间、过期时间、剩余时间）
- 🔄 实时刷新Token状态
- ✨ 创建新Token（支持自定义过期时间和描述）
- 📋 一键复制Token到剪贴板
- ⏰ 智能时间显示（年/天/小时/分钟）

**创建新Token**:
1. 输入描述（可选，如"iOS快捷指令专用"）
2. 选择过期时间：
   - 预设选项：1小时、1天、7天、30天、1年、99年
   - 自定义时间：支持格式如`5d`、`2h`、`30m`、`1y`
3. 点击"创建新Token"
4. 立即复制生成的Token（页面关闭后无法再查看）

### 密码修改
- 目前需要通过API接口修改密码
- 后续版本会在前端添加密码修改页面

## 📱 iOS快捷指令使用

### 1. 获取Token
有以下几种方式获取token：

**方式一：直接登录获取**
```bash
curl -X POST http://你的服务器地址/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123", "expiresIn": "99y"}'
```

**方式二：通过Token管理页面创建**
1. 登录系统
2. 进入"Token管理"页面
3. 创建专用于iOS快捷指令的token
4. 复制token供快捷指令使用

响应示例：
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2122-01-01T00:00:00.000Z",
  "user": {
    "id": "user-id",
    "username": "admin", 
    "role": "admin"
  }
}
```

### 2. 快捷指令配置

**步骤一：创建获取Token的快捷指令**
1. 打开"快捷指令"应用
2. 创建新的快捷指令
3. 添加"获取网页内容"操作
4. 设置：
   - URL: `http://你的服务器地址/api/auth/login`
   - 方法: POST
   - 请求体: `{"username": "admin", "password": "admin123", "expiresIn": "99y"}`
   - Headers: `Content-Type: application/json`
5. 添加"获取词典中的值"操作，键名为 `token`
6. 保存为"获取会员卡Token"

**步骤二：创建快捷记录指令**
1. 创建新的快捷指令
2. 添加"运行快捷指令"操作，选择"获取会员卡Token"
3. 添加"获取网页内容"操作
4. 设置：
   - URL: `http://你的服务器地址/api/records/quick`
   - 方法: POST
   - Headers: 
     - `Content-Type: application/json`
     - `Authorization: Bearer [提供的输入]` (选择步骤2的输出)
   - 请求体: `{"keyword": "关键字"}` (可以设置为输入变量)
5. 设置Siri触发词，如"记录会员卡"

## 🔧 API接口认证

### 认证方式
所有API接口都需要在请求头中包含Authorization：

```
Authorization: Bearer your-jwt-token-here
```

### 认证相关接口

#### 登录（支持自定义过期时间）
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "expiresIn": "99y"  // 可选，默认99年
}
```

#### 验证Token
```http
GET /api/auth/verify
Authorization: Bearer your-token
```

#### 获取当前Token信息
```http
GET /api/auth/token-info
Authorization: Bearer your-token
```

#### 创建新Token
```http
POST /api/auth/create-token
Authorization: Bearer your-token
Content-Type: application/json

{
  "expiresIn": "30d",  // 可选，默认99年
  "description": "iOS快捷指令专用token"  // 可选
}
```

#### 修改密码
```http
POST /api/auth/change-password
Authorization: Bearer your-token
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

## ⚙️ 环境变量配置

在生产环境中，建议设置以下环境变量：

```bash
# JWT密钥（必须设置为复杂的随机字符串）
JWT_SECRET=your-very-secure-random-secret-key

# Token默认有效期（默认99年）
JWT_EXPIRES_IN=99y
```

## 🛡️ 安全特性

1. **JWT Token认证**: 使用行业标准的JWT进行身份验证
2. **密码加密**: 使用bcrypt加密存储密码
3. **灵活过期时间**: 支持从分钟到99年的任意过期时间设置
4. **Token管理**: 完整的Token管理界面，方便查看和创建
5. **路由保护**: 前端路由完全保护，未登录无法访问
6. **API保护**: 所有API接口都需要有效token
7. **自动清理**: Token过期后自动清理并重定向到登录页

## 🕒 时间格式说明

支持的时间单位：
- `s` - 秒
- `m` - 分钟  
- `h` - 小时
- `d` - 天
- `y` - 年

示例：
- `30s` - 30秒
- `5m` - 5分钟
- `2h` - 2小时
- `7d` - 7天
- `1y` - 1年
- `99y` - 99年（默认）

## 🔍 错误码说明

- `401 Unauthorized`: 访问令牌缺失
- `403 Forbidden`: 访问令牌无效或已过期
- `400 Bad Request`: 请求参数错误

## 📋 快捷记录专用示例

使用curl测试快捷记录功能：

```bash
# 1. 先登录获取token（99年有效期）
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123", "expiresIn": "99y"}' | \
  jq -r '.token')

# 2. 使用token创建快捷记录
curl -X POST http://localhost:5000/api/records/quick \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"keyword": "游泳"}'

# 3. 查看token信息
curl -X GET http://localhost:5000/api/auth/token-info \
  -H "Authorization: Bearer $TOKEN"
```

## 🎯 最佳实践

1. **长期使用**: 为iOS快捷指令创建99年有效期的专用token
2. **临时访问**: 为临时访问创建较短有效期的token
3. **定期检查**: 通过Token管理页面定期检查token状态
4. **安全存储**: 妥善保存生成的token，避免泄露
5. **描述标注**: 为不同用途的token添加清晰的描述

现在您的会员卡管理系统已经具备完整的Token管理功能！🎉 