const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const STATIC_PATH = process.env.STATIC_PATH || path.join(__dirname, '../client');

// 中间件
app.use(cors());
app.use(express.json());

// 设置文件存储路径
const dataDir = path.join(__dirname, 'data');
const cardsFile = path.join(dataDir, 'cards.json');
const recordsFile = path.join(dataDir, 'records.json');

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

// API路由
// 获取所有会员卡
app.get('/api/cards', (req, res) => {
  const cards = readData(cardsFile);
  res.json(cards);
});

// 创建会员卡
app.post('/api/cards', (req, res) => {
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
app.get('/api/cards/:id', (req, res) => {
  const cards = readData(cardsFile);
  const card = cards.find(card => card.id === req.params.id);
  
  if (!card) {
    return res.status(404).json({ message: '未找到会员卡' });
  }
  
  res.json(card);
});

// 更新会员卡
app.put('/api/cards/:id', (req, res) => {
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
app.put('/api/cards', (req, res) => {
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
app.delete('/api/cards/:id', (req, res) => {
  const cards = readData(cardsFile);
  const filteredCards = cards.filter(card => card.id !== req.params.id);
  
  if (filteredCards.length === cards.length) {
    return res.status(404).json({ message: '未找到会员卡' });
  }
  
  writeData(cardsFile, filteredCards);
  res.json({ message: '会员卡已删除' });
});

// 获取所有使用记录
app.get('/api/records', (req, res) => {
  const records = readData(recordsFile);
  res.json(records);
});

// 获取特定卡的使用记录
app.get('/api/cards/:id/records', (req, res) => {
  const records = readData(recordsFile);
  const cardRecords = records.filter(record => record.cardId === req.params.id);
  res.json(cardRecords);
});

// 创建使用记录
app.post('/api/records', (req, res) => {
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
app.post('/api/records/batch', (req, res) => {
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
app.put('/api/records/:id', (req, res) => {
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
app.put('/api/records', (req, res) => {
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
app.delete('/api/records/:id', (req, res) => {
  const records = readData(recordsFile);
  const filteredRecords = records.filter(record => record.id !== req.params.id);
  
  if (filteredRecords.length === records.length) {
    return res.status(404).json({ message: '未找到使用记录' });
  }
  
  writeData(recordsFile, filteredRecords);
  res.json({ message: '使用记录已删除' });
});

// 批量删除使用记录
app.delete('/api/records', (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: '请求体必须是ID数组' });
  }
  
  const records = readData(recordsFile);
  const recordIdsToDelete = req.body;
  const filteredRecords = records.filter(record => !recordIdsToDelete.includes(record.id));
  
  writeData(recordsFile, filteredRecords);
  res.json({ message: '使用记录已批量删除' });
});

// 导出数据
app.get('/api/export', (req, res) => {
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
app.post('/api/import', upload.single('file'), (req, res) => {
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