const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

// 测试快捷记录API
async function testQuickRecord() {
  console.log('开始测试快捷记录API...\n');

  try {
    // 1. 首先获取所有会员卡，确保有数据可以测试
    console.log('1. 获取现有会员卡...');
    const cardsResponse = await fetch(`${API_BASE}/cards`);
    const cards = await cardsResponse.json();
    console.log(`   找到 ${cards.length} 张会员卡`);
    
    if (cards.length === 0) {
      console.log('   没有会员卡，无法测试快捷记录功能');
      return;
    }

    // 显示前几张卡的信息
    cards.slice(0, 3).forEach(card => {
      console.log(`   - ${card.name} (${card.type}) - 剩余次数: ${card.remainingDays}`);
    });

    console.log('\n2. 测试快捷记录API...');
    
    // 使用第一张卡的名称的部分关键字进行测试
    const testCard = cards[0];
    const keyword = testCard.name.substring(0, 2); // 取前两个字符作为关键字
    
    console.log(`   使用关键字: "${keyword}"`);
    
    const quickRecordResponse = await fetch(`${API_BASE}/records/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
    });

    if (quickRecordResponse.ok) {
      const result = await quickRecordResponse.json();
      console.log('   ✅ 快捷记录创建成功!');
      console.log(`   匹配的会员卡: ${result.card.name}`);
      console.log(`   记录ID: ${result.record.id}`);
      console.log(`   记录日期: ${result.record.date}`);
      console.log(`   剩余次数: ${result.card.remainingDays}`);
    } else {
      const error = await quickRecordResponse.json();
      console.log('   ❌ 快捷记录创建失败:');
      console.log(`   错误信息: ${error.message}`);
    }

    console.log('\n3. 测试不存在的关键字...');
    const nonExistentKeyword = 'xyz不存在的卡';
    
    const failResponse = await fetch(`${API_BASE}/records/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword: nonExistentKeyword }),
    });

    if (failResponse.ok) {
      console.log('   ⚠️  意外成功了（不应该找到匹配）');
    } else {
      const error = await failResponse.json();
      console.log('   ✅ 正确返回错误:');
      console.log(`   错误信息: ${error.message}`);
    }

    console.log('\n测试完成!');

  } catch (error) {
    console.error('测试失败:', error.message);
    console.log('请确保服务器正在运行 (cd server && npm start)');
  }
}

// 运行测试
testQuickRecord(); 