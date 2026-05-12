let capture; // 宣告一個變數來儲存攝影機物件
let faceMesh; // 宣告 faceMesh 變數
let handPose; // 宣告 handPose 變數
let faces = []; // 儲存辨識結果的陣列
let hands = []; // 儲存手勢辨識結果
let modelReady = false; // 新增一個旗標來追蹤模型載入狀態
let earringImgs = []; // 儲存耳環圖片陣列
let currentEarringIndex = 0; // 目前顯示的耳環索引

function preload() {
  // 預先載入 5 張耳環圖片
  earringImgs[0] = loadImage('pic/acc/acc1_ring.png');
  earringImgs[1] = loadImage('pic/acc/acc2_pearl.png');
  earringImgs[2] = loadImage('pic/acc/acc3_tassel.png');
  earringImgs[3] = loadImage('pic/acc/acc4_jade.png');
  earringImgs[4] = loadImage('pic/acc/acc5_phoenix.png');
}

function setup() {
  // 1. 產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  
  // 2. 擷取攝影機影像內容
  capture = createCapture(VIDEO);
  // 隱藏預設在畫布下方產生的 HTML 影片元件，確保影像只顯示在畫布內
  capture.hide();
  
  // 設定影像繪製模式為 CENTER，方便後續置中處理
  imageMode(CENTER);

  // 初始化 faceMesh 模型
  faceMesh = ml5.faceMesh(capture, modelLoaded);
  
  // 初始化 handPose 模型
  handPose = ml5.handPose(capture, () => {
    console.log("手勢模型準備就緒");
  });
}

// 當 ml5 模型載入完成後呼叫此函式
function modelLoaded() {
  console.log("模型準備就緒");
  modelReady = true; // 設定旗標為 true
  faceMesh.detectStart(capture, (results) => { faces = results; }); // 開始偵測影像
  handPose.detectStart(capture, (results) => { hands = results; }); // 開始偵測手勢
}

function draw() {
  // 3. 設定畫布背景顏色為 e7c6ff
  background('#e7c6ff');

  // 繪製上方置中文字
  fill(0); // 設定文字顏色為黑色
  textSize(24); // 設定文字大小
  textAlign(CENTER, TOP); // 文字水平置中，基準點在上方
  text("414730357林OO", width / 2, 20); // 第一行文字
  text("作品為影像辨識_耳環臉譜", width / 2, 55); // 第二行文字

  // 4. 計算顯示的寬高（畫布寬高的 50%）
  let displayW = width * 0.5;
  let displayH = height * 0.5;

  // 5. 實作左右顛倒（鏡像）與置中顯示
  push(); // 儲存目前的繪圖狀態
  // 將座標原點移至畫布中心
  translate(width / 2, height / 2);
  // 使用 scale(-1, 1) 進行水平翻轉（左右顛倒）
  scale(-1, 1);
  // 繪製影像，因為已經使用了 translate 和 imageMode(CENTER)，
  // 這裡的座標設定為 (0, 0) 就會剛好在畫布中間
  image(capture, 0, 0, displayW, displayH);
  
  // 手勢偵測邏輯：判斷伸出幾根手指來切換耳環
  if (hands.length > 0) {
    let hand = hands[0];
    let count = 0;
    
    // 簡單判斷：指尖 (Tip) 是否高於關節 (PIP)
    const fingerTips = [8, 12, 16, 20]; // 食、中、無名、小指
    const fingerPips = [6, 10, 14, 18];
    for (let i = 0; i < 4; i++) {
      if (hand.keypoints[fingerTips[i]].y < hand.keypoints[fingerPips[i]].y) count++;
    }
    // 大拇指特別判斷 (在鏡像視角下，判斷大拇指與小指基部的距離)
    let thumbTip = hand.keypoints[4];
    let pinkyBase = hand.keypoints[17];
    let indexBase = hand.keypoints[5];
    if (dist(thumbTip.x, thumbTip.y, pinkyBase.x, pinkyBase.y) > dist(indexBase.x, indexBase.y, pinkyBase.x, pinkyBase.y)) {
      count++;
    }

    // 如果偵測到 1-5 根手指，更新目前耳環索引
    if (count >= 1 && count <= 5) {
      currentEarringIndex = count - 1;
    }
  }

  // 影像辨識與繪製耳環
  if (modelReady && faces.length > 0) { // 只有當模型準備就緒且偵測到臉部時才進行繪製
    let face = faces[0];
    // 修正索引點：150 與 379 是 FaceMesh 中左右耳垂最底端的精確位置
    let earR = face.keypoints[150]; // 右耳垂
    let earL = face.keypoints[379]; // 左耳垂
    
    // 計算臉部寬度作為位移比率的基準
    let faceWidth = dist(face.keypoints[234].x, face.keypoints[234].y, face.keypoints[454].x, face.keypoints[454].y);
    let scaledFaceWidth = map(faceWidth, 0, capture.width, 0, displayW);
    let xOffset = scaledFaceWidth * 0.08; // 向外移動比率
    let yOffset = scaledFaceWidth * 0.05; // 向上移動比率

    let earPoints = [{pt: earR, dir: -1}, {pt: earL, dir: 1}];

    for (let item of earPoints) {
      // 將攝影機原始座標映射到畫布上的影像顯示區域 (-displayW/2 到 displayW/2)
      let mappedX = map(item.pt.x, 0, capture.width, -displayW / 2, displayW / 2);
      let mappedY = map(item.pt.y, 0, capture.height, -displayH / 2, displayH / 2);

      // 繪製對應手指數量的耳環，應用比率位移（dir 控制左右方向）
      // 耳環大小也隨臉部大小縮放
      let imgSize = scaledFaceWidth * 0.35;
      image(earringImgs[currentEarringIndex], mappedX + (xOffset * item.dir), mappedY - yOffset, imgSize, imgSize);
    }
  }
  pop(); // 恢復到之前的繪圖狀態，避免影響後續繪圖
}

// 額外處理：當瀏覽器視窗大小改變時，自動調整畫布以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
