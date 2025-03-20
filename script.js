async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    const resultDiv = document.getElementById('result');
    const resultWrapper = document.getElementById('resultWrapper');
    const loading = document.getElementById('loading');
    
    // 显示加载中状态
    loading.style.display = 'block';
    resultWrapper.style.display = 'none';
    
    resultDiv.textContent = '正在请求中...';

    const requestData = {
        bot_id: "7483802791279034380",
        user_id: "123456789",
        stream: true,
        auto_save_history: true,
        additional_messages: [
            {
                role: "user",
                content: userInput,
                content_type: "text"
            }
        ]
    };

    try {
        const response = await fetch('https://api.coze.cn/v3/chat', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer pat_Lptu1kr2XCwwqX3D2R3AaXHHVGTWaaNP8madDu5ZnN3xT2VVx2crx6x0b9UnP4mX',
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Origin': window.location.origin
            },
            body: JSON.stringify(requestData),
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let completeContent = '';

        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            
            // 处理SSE格式数据
            const lines = chunk.split('\n');
            let currentEvent = '';
            let currentData = '';
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.startsWith('event:')) {
                    // 新事件开始
                    currentEvent = line.slice(6).trim();
                    continue;
                }
                
                if (line.startsWith('data:')) {
                    currentData = line.slice(5).trim();
                    
                    // 处理事件数据
                    if (currentEvent === 'conversation.message.delta') {
                        try {
                            const data = JSON.parse(currentData);
                            if (data.content && data.type === 'answer') {
                                completeContent = data.content;
                            }
                        } catch (e) {
                            console.error('解析delta数据时出错:', e);
                        }
                    } else if (currentEvent === 'done') {
                        // 传输完成
                        break;
                    }
                }
            }
        }
        
        // 隐藏加载状态
        loading.style.display = 'none';
        resultWrapper.style.display = 'block';
        
        // 检查是否是图片链接
        if (completeContent && (completeContent.startsWith('http') && 
            (completeContent.endsWith('.jpg') || 
             completeContent.endsWith('.jpeg') || 
             completeContent.endsWith('.png') || 
             completeContent.endsWith('.gif') ||
             completeContent.includes('coze.cn/t/')))) {
            
            // 清空结果区域
            resultDiv.innerHTML = '';
            
            // 创建图片元素
            const imgElement = document.createElement('img');
            imgElement.src = completeContent;
            imgElement.alt = '生成的古风头像';
            imgElement.classList.add('generated-avatar');
            
            // 添加图片到结果区域
            resultDiv.appendChild(imgElement);
            
            // 添加加载动画
            imgElement.onload = function() {
                // 图片加载完成后的效果
                imgElement.classList.add('loaded');
                
                // 触发墨池涟漪效果
                createInkRipple(resultDiv);
            };
            
            // 图片加载失败处理
            imgElement.onerror = function() {
                resultDiv.innerHTML = `<p>图片加载失败。链接: ${completeContent}</p>`;
            };
        } else if (completeContent) {
            // 如果不是图片链接，直接显示文本内容
            resultDiv.textContent = completeContent;
        } else {
            resultDiv.textContent = '没有获取到有效的回复内容';
        }
    } catch (error) {
        loading.style.display = 'none';
        resultWrapper.style.display = 'block';
        resultDiv.textContent = '发生错误: ' + error.message;
        console.error('请求出错:', error);
    }
}

// 墨池涟漪效果
function createInkRipple(container) {
    const inkContainer = document.createElement('div');
    inkContainer.classList.add('ink-ripple-container');
    container.appendChild(inkContainer);
    
    // 创建多个墨点
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            const ink = document.createElement('div');
            ink.classList.add('ink-drop');
            
            // 随机位置
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            ink.style.left = `${posX}%`;
            ink.style.top = `${posY}%`;
            
            // 随机大小
            const size = 5 + Math.random() * 15;
            ink.style.width = `${size}px`;
            ink.style.height = `${size}px`;
            
            // 随机透明度
            const opacity = 0.3 + Math.random() * 0.7;
            ink.style.opacity = opacity;
            
            // 添加并在动画结束后移除
            inkContainer.appendChild(ink);
            setTimeout(() => {
                ink.remove();
            }, 2000);
            
        }, i * 50); // 每50ms创建一个新的墨点
    }
    
    // 2秒后移除容器
    setTimeout(() => {
        inkContainer.remove();
    }, 3000);
} 