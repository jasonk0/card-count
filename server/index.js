const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const STATIC_PATH = process.env.STATIC_PATH || path.join(__dirname, '../client');

// JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '99y';

// 中间件
app.use(cors());
app.use(express.json());

// 设置文件存储路径
const dataDir = path.join(__dirname, 'data');
const cardsFile = path.join(dataDir, 'cards.json');
const recordsFile = path.join(dataDir, 'records.json');
const usersFile = path.join(dataDir, 'users.json');
const tokensFile = path.join(dataDir, 'tokens.json');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 确保文件存在
if (!fs.existsSync(cardsFile)) {
  fs.writeFileSync(cardsFile, JSON.stringify([]));
}
if (!fs.existsSync(recordsFile)) {
  fs.writeFileSync(recordsFile, JSON.stringify([]));
}
if (!fs.existsSync(tokensFile)) {
  fs.writeFileSync(tokensFile, JSON.stringify([]));
}
if (!fs.existsSync(usersFile)) {
  // 创建默认管理员用户 (用户名: admin, 密码: admin123)
  const defaultUsers = [{
    id: uuidv4(),
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  }];
  fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
  console.log('创建默认管理员账户 - 用户名: admin, 密码: admin123');
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
});
const upload = multer({ storage });

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 辅助函数
const readData = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
    return [];
  }
};

const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`写入文件失败: ${filePath}`, error);
    return false;
  }
};

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: '访问令牌缺失' });
  }

  // 检查token是否被撤销
  const tokens = readData(tokensFile);
  const tokenRecord = tokens.find(t => t.token === token);
  if (tokenRecord && !tokenRecord.isActive) {
    return res.status(403).json({ message: '访问令牌已被撤销' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '访问令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// 生成JWT令牌
const generateToken = (user, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn }
  );
};

// 登录接口
app.post('/api/auth/login', (req, res) => {
  const { username, password, expiresIn } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const users = readData(usersFile);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const token = generateToken(user, expiresIn);
  
  // 解析token获取过期时间
  const decoded = jwt.decode(token);
  
  // 保存token记录
  const tokens = readData(tokensFile);
  const tokenRecord = {
    id: uuidv4(),
    token: token,
    userId: user.id,
    username: user.username,
    description: '登录获取的token',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
    isActive: true,
    source: 'login'
  };
  tokens.push(tokenRecord);
  writeData(tokensFile, tokens);
  
  res.json({
    message: '登录成功',
    token,
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

// 创建新token接口
app.post('/api/auth/create-token', authenticateToken, (req, res) => {
  const { expiresIn = JWT_EXPIRES_IN, description } = req.body;
  
  const users = readData(usersFile);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  const token = generateToken(user, expiresIn);
  const decoded = jwt.decode(token);
  
  // 保存token记录
  const tokens = readData(tokensFile);
  const tokenRecord = {
    id: uuidv4(),
    token: token,
    userId: user.id,
    username: user.username,
    description: description || '手动创建的token',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
    isActive: true,
    source: 'manual'
  };
  tokens.push(tokenRecord);
  writeData(tokensFile, tokens);
  
  res.json({
    message: '新token创建成功',
    token,
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
    description: description || '手动创建的token',
    createdAt: new Date().toISOString()
  });
});

// 获取token信息接口
app.get('/api/auth/token-info', authenticateToken, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.decode(token);
    
    res.json({
      user: req.user,
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      timeRemaining: decoded.exp - Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    res.status(400).json({ message: 'Token信息解析失败' });
  }
});

// 获取所有token列表接口
app.get('/api/auth/tokens', authenticateToken, (req, res) => {
  try {
    const tokens = readData(tokensFile);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // 为每个token添加状态信息
    const tokensWithStatus = tokens.map(tokenRecord => {
      try {
        const decoded = jwt.decode(tokenRecord.token);
        const isExpired = decoded.exp < currentTime;
        const timeRemaining = decoded.exp - currentTime;
        
        return {
          ...tokenRecord,
          isExpired,
          timeRemaining,
          isCurrentToken: tokenRecord.token === req.headers['authorization']?.split(' ')[1]
        };
      } catch (error) {
        return {
          ...tokenRecord,
          isExpired: true,
          timeRemaining: -1,
          isCurrentToken: false,
          error: 'Token解析失败'
        };
      }
    });
    
    // 按创建时间倒序排列
    tokensWithStatus.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(tokensWithStatus);
  } catch (error) {
    res.status(500).json({ message: '获取token列表失败', error: error.message });
  }
});

// 撤销token接口
app.delete('/api/auth/tokens/:id', authenticateToken, (req, res) => {
  try {
    const tokenId = req.params.id;
    const tokens = readData(tokensFile);
    
    const tokenIndex = tokens.findIndex(t => t.id === tokenId);
    if (tokenIndex === -1) {
      return res.status(404).json({ message: '未找到指定的token' });
    }
    
    const tokenToRevoke = tokens[tokenIndex];
    
    // 检查是否是当前使用的token
    const currentToken = req.headers['authorization']?.split(' ')[1];
    if (tokenToRevoke.token === currentToken) {
      return res.status(400).json({ message: '不能撤销当前正在使用的token' });
    }
    
    // 标记为已撤销而不是删除，保留记录
    tokens[tokenIndex].isActive = false;
    tokens[tokenIndex].revokedAt = new Date().toISOString();
    tokens[tokenIndex].revokedBy = req.user.username;
    
    writeData(tokensFile, tokens);
    
    res.json({ 
      message: 'Token已撤销',
      revokedToken: {
        id: tokenToRevoke.id,
        description: tokenToRevoke.description,
        createdAt: tokenToRevoke.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: '撤销token失败', error: error.message });
  }
});

// 清理过期token接口
app.delete('/api/auth/tokens/cleanup', authenticateToken, (req, res) => {
  try {
    const tokens = readData(tokensFile);
    const currentTime = Math.floor(Date.now() / 1000);
    let cleanedCount = 0;
    
    const activeTokens = tokens.filter(tokenRecord => {
      try {
        const decoded = jwt.decode(tokenRecord.token);
        const isExpired = decoded.exp < currentTime;
        
        if (isExpired && tokenRecord.isActive) {
          cleanedCount++;
          return false; // 移除过期的token
        }
        return true; // 保留未过期的token
      } catch (error) {
        cleanedCount++;
        return false; // 移除无法解析的token
      }
    });
    
    writeData(tokensFile, activeTokens);
    
    res.json({ 
      message: `清理完成，删除了${cleanedCount}个过期token`,
      cleanedCount
    });
  } catch (error) {
    res.status(500).json({ message: '清理过期token失败', error: error.message });
  }
});

// 永久删除token接口
app.delete('/api/auth/tokens/:id/permanent', authenticateToken, (req, res) => {
  try {
    const tokenId = req.params.id;
    const tokens = readData(tokensFile);
    
    const tokenIndex = tokens.findIndex(t => t.id === tokenId);
    if (tokenIndex === -1) {
      return res.status(404).json({ message: '未找到指定的token' });
    }
    
    const tokenToDelete = tokens[tokenIndex];
    
    // 检查是否是当前使用的token
    const currentToken = req.headers['authorization']?.split(' ')[1];
    if (tokenToDelete.token === currentToken) {
      return res.status(400).json({ message: '不能删除当前正在使用的token' });
    }
    
    // 永久删除token记录
    tokens.splice(tokenIndex, 1);
    writeData(tokensFile, tokens);
    
    res.json({ 
      message: 'Token已永久删除',
      deletedToken: {
        id: tokenToDelete.id,
        description: tokenToDelete.description,
        createdAt: tokenToDelete.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: '删除token失败', error: error.message });
  }
});

// 验证令牌接口
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    message: '令牌有效',
    user: req.user
  });
});

// 修改密码接口
app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '当前密码和新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: '新密码长度至少6位' });
  }

  const users = readData(usersFile);
  const userIndex = users.findIndex(u => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }

  const user = users[userIndex];
  const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    return res.status(401).json({ message: '当前密码错误' });
  }

  // 更新密码
  users[userIndex].password = bcrypt.hashSync(newPassword, 10);
  writeData(usersFile, users);

  res.json({ message: '密码修改成功' });
});

// API路由
// 获取所有会员卡
app.get('/api/cards', authenticateToken, (req, res) => {
  const cards = readData(cardsFile);
  res.json(cards);
});

// 创建会员卡
app.post('/api/cards', authenticateToken, (req, res) => {
  const cards = readData(cardsFile);
  const newCard = {
    ...req.body,
    id: req.body.id || uuidv4(),
    pauseHistory: req.body.pauseHistory || []
  };
  
  cards.push(newCard);
  writeData(cardsFile, cards);
  res.status(201).json(newCard);
});

// 获取单个会员卡
app.get('/api/cards/:id', authenticateToken, (req, res) => {
  const cards = readData(cardsFile);
  const card = cards.find(card => card.id === req.params.id);
  
  if (!card) {
    return res.status(404).json({ message: '未找到会员卡' });
  }
  
  res.json(card);
});

// 更新会员卡
app.put('/api/cards/:id', authenticateToken, (req, res) => {
  const cards = readData(cardsFile);
  const index = cards.findIndex(card => card.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: '未找到会员卡' });
  }
  
  const updatedCard = {
    ...cards[index],
    ...req.body,
    id: req.params.id // 确保ID不变
  };
  
  cards[index] = updatedCard;
  writeData(cardsFile, cards);
  res.json(updatedCard);
});

// 批量更新会员卡
app.put('/api/cards', authenticateToken, (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: '请求体必须是会员卡数组' });
  }
  
  const cards = readData(cardsFile);
  const updatedCards = [];
  
  req.body.forEach(updatedCard => {
    const index = cards.findIndex(card => card.id === updatedCard.id);
    if (index !== -1) {
      cards[index] = {
        ...cards[index],
        ...updatedCard,
        id: updatedCard.id // 确保ID不变
      };
      updatedCards.push(cards[index]);
    }
  });
  
  writeData(cardsFile, cards);
  res.json(updatedCards);
});

// 删除会员卡
app.delete('/api/cards/:id', authenticateToken, (req, res) => {
  const cards = readData(cardsFile);
  const filteredCards = cards.filter(card => card.id !== req.params.id);
  
  if (filteredCards.length === cards.length) {
    return res.status(404).json({ message: '未找到会员卡' });
  }
  
  writeData(cardsFile, filteredCards);
  res.json({ message: '会员卡已删除' });
});

// 获取所有使用记录
app.get('/api/records', authenticateToken, (req, res) => {
  const records = readData(recordsFile);
  res.json(records);
});

// 获取特定卡的使用记录
app.get('/api/cards/:id/records', authenticateToken, (req, res) => {
  const records = readData(recordsFile);
  const cardRecords = records.filter(record => record.cardId === req.params.id);
  res.json(cardRecords);
});

// 创建使用记录
app.post('/api/records', authenticateToken, (req, res) => {
  const records = readData(recordsFile);
  const newRecord = {
    ...req.body,
    id: req.body.id || uuidv4()
  };
  
  records.push(newRecord);
  writeData(recordsFile, records);
  res.status(201).json(newRecord);
});

// 批量创建使用记录
app.post('/api/records/batch', authenticateToken, (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: '请求体必须是记录数组' });
  }
  
  const records = readData(recordsFile);
  const newRecords = req.body.map(record => ({
    ...record,
    id: record.id || uuidv4()
  }));
  
  records.push(...newRecords);
  writeData(recordsFile, records);
  res.status(201).json(newRecords);
});

// 更新使用记录
app.put('/api/records/:id', authenticateToken, (req, res) => {
  const records = readData(recordsFile);
  const index = records.findIndex(record => record.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: '未找到使用记录' });
  }
  
  const updatedRecord = {
    ...records[index],
    ...req.body,
    id: req.params.id // 确保ID不变
  };
  
  records[index] = updatedRecord;
  writeData(recordsFile, records);
  res.json(updatedRecord);
});

// 批量更新使用记录
app.put('/api/records', authenticateToken, (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: '请求体必须是记录数组' });
  }
  
  const records = readData(recordsFile);
  const updatedRecords = [];
  
  req.body.forEach(updatedRecord => {
    const index = records.findIndex(record => record.id === updatedRecord.id);
    if (index !== -1) {
      records[index] = {
        ...records[index],
        ...updatedRecord,
        id: updatedRecord.id // 确保ID不变
      };
      updatedRecords.push(records[index]);
    }
  });
  
  writeData(recordsFile, records);
  res.json(updatedRecords);
});

// 删除使用记录
app.delete('/api/records/:id', authenticateToken, (req, res) => {
  const records = readData(recordsFile);
  const filteredRecords = records.filter(record => record.id !== req.params.id);
  
  if (filteredRecords.length === records.length) {
    return res.status(404).json({ message: '未找到使用记录' });
  }
  
  writeData(recordsFile, filteredRecords);
  res.json({ message: '使用记录已删除' });
});

// 批量删除使用记录
app.delete('/api/records', authenticateToken, (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: '请求体必须是ID数组' });
  }
  
  const records = readData(recordsFile);
  const recordIdsToDelete = req.body;
  const filteredRecords = records.filter(record => !recordIdsToDelete.includes(record.id));
  
  writeData(recordsFile, filteredRecords);
  res.json({ message: '使用记录已批量删除' });
});

// 快捷记录 - 通过关键字模糊匹配会员卡创建使用记录
app.post('/api/records/quick', authenticateToken, (req, res) => {
  const { keyword } = req.body;
  
  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ message: '关键字不能为空' });
  }
  
  const cards = readData(cardsFile);
  const records = readData(recordsFile);
  
  // 模糊匹配会员卡名称（忽略大小写）
  const matchedCards = cards.filter(card => 
    card.name.toLowerCase().includes(keyword.toLowerCase().trim())
  );
  
  if (matchedCards.length === 0) {
    return res.status(404).json({ 
      message: '未找到匹配的会员卡',
      keyword: keyword 
    });
  }
  
  if (matchedCards.length > 1) {
    return res.status(400).json({ 
      message: '匹配到多张会员卡，请使用更精确的关键字',
      keyword: keyword,
      matchedCards: matchedCards.map(card => ({
        id: card.id,
        name: card.name,
        type: card.type
      }))
    });
  }
  
  const targetCard = matchedCards[0];
  
  // 检查卡片是否有效（剩余天数大于0）
  if (targetCard.remainingDays <= 0) {
    return res.status(400).json({ 
      message: '该会员卡已无剩余次数',
      card: {
        id: targetCard.id,
        name: targetCard.name,
        remainingDays: targetCard.remainingDays
      }
    });
  }
  
  // 创建使用记录
  const newRecord = {
    id: uuidv4(),
    cardId: targetCard.id,
    date: new Date().toISOString().split('T')[0], // 当前日期 YYYY-MM-DD
    isUsed: true,
    isSold: false,
    soldPrice: null,
    notes: `快捷记录 - ${keyword}`,
    createdAt: new Date().toISOString()
  };
  
  records.push(newRecord);
  writeData(recordsFile, records);
  
  // 减少会员卡剩余天数
  const updatedCard = {
    ...targetCard,
    remainingDays: targetCard.remainingDays - 1
  };
  
  const cardIndex = cards.findIndex(card => card.id === targetCard.id);
  cards[cardIndex] = updatedCard;
  writeData(cardsFile, cards);
  
  res.status(201).json({
    message: '快捷记录创建成功',
    record: newRecord,
    card: updatedCard,
    keyword: keyword
  });
});

// 导出数据
app.get('/api/export', authenticateToken, (req, res) => {
  const cards = readData(cardsFile);
  const records = readData(recordsFile);
  
  const exportData = {
    cards,
    records,
    exportDate: new Date().toISOString()
  };
  
  res.json(exportData);
});

// 导入数据
app.post('/api/import', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未提供文件' });
    }
    
    const filePath = req.file.path;
    const fileData = fs.readFileSync(filePath, 'utf8');
    const importData = JSON.parse(fileData);
    
    if (!importData.cards || !importData.records) {
      return res.status(400).json({ message: '导入文件格式不正确' });
    }
    
    // 替换现有数据或合并数据，根据需求决定
    writeData(cardsFile, importData.cards);
    writeData(recordsFile, importData.records);
    
    // 删除上传的文件
    fs.unlinkSync(filePath);
    
    res.json({ 
      message: '数据导入成功',
      cardsCount: importData.cards.length,
      recordsCount: importData.records.length
    });
  } catch (error) {
    console.error('导入数据失败:', error);
    res.status(500).json({ message: '导入数据失败', error: error.message });
  }
});

// 配置静态文件服务
// 检查静态文件目录是否存在
if (fs.existsSync(STATIC_PATH)) {
  console.log(`提供静态文件服务，路径: ${STATIC_PATH}`);
  
  // 静态文件服务
  app.use(express.static(STATIC_PATH));
  
  // 所有未匹配的路由都返回index.html
  app.get('*', (req, res) => {
    // 排除API路由
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(STATIC_PATH, 'index.html'));
    }
  });
} else {
  console.log(`警告: 静态文件路径不存在: ${STATIC_PATH}`);
}

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 