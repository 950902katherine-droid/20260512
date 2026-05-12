let capture; // 宣告一個變數來儲存攝影機物件
let faceMesh; // 宣告 faceMesh 變數
let faces = []; // 儲存辨識結果的陣列
let modelReady = false; // 新增一個旗標來追蹤模型載入狀態

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
  // 模型載入完成後，會呼叫 modelLoaded 函式
  faceMesh = ml5.faceMesh(capture, modelLoaded);
}

// 當 ml5 模型載入完成後呼叫此函式
function modelLoaded() {
  console.log("模型準備就緒");
  modelReady = true; // 設定旗標為 true
  faceMesh.detectStart(capture, (results) => { faces = results; }); // 開始偵測影像
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

  // 影像辨識與繪製耳環
  if (modelReady && faces.length > 0) { // 只有當模型準備就緒且偵測到臉部時才進行繪製
    let face = faces[0];
    // 修正索引點：150 與 379 是 FaceMesh 中左右耳垂最底端的精確位置
    let earPoints = [face.keypoints[150], face.keypoints[379]];

    fill(255, 255, 0); // 黃色
    noStroke();

    for (let pt of earPoints) {
      // 將攝影機原始座標映射到畫布上的影像顯示區域 (-displayW/2 到 displayW/2)
      let mappedX = map(pt.x, 0, capture.width, -displayW / 2, displayW / 2);
      let mappedY = map(pt.y, 0, capture.height, -displayH / 2, displayH / 2);

      // 繪製三個垂直排列的圓圈
      for (let i = 0; i < 3; i++) {
        let offsetY = 5 + (i * 12); // 從耳垂下方 5 像素處開始，每隔 12 像素畫一個圓
        circle(mappedX, mappedY + offsetY, 7); // 圓圈直徑設定為 7
      }
    }
  }
  pop(); // 恢復到之前的繪圖狀態，避免影響後續繪圖
}

// 額外處理：當瀏覽器視窗大小改變時，自動調整畫布以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
