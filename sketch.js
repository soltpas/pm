// --- 変数の宣言 ---
let mode = 0; // 0: スタート, 1: プレイ中, 2: ゲームオーバー, 3: クリア
let CELL_SIZE = 40; // 1マスのピクセルサイズ
let a = 0;
let b = 0;
let c = 0;
let d = 0;
let e = 2;
let cs = 1000;

// マップの2次元配列: 1=壁, 0=通路（ドットあり）
let baseMap = [
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
];
let map = [];

function copyBaseMap() {
    map = JSON.parse(JSON.stringify(baseMap));
}

function randomizeMapSection(r0, c0, r1, c1, wallProbability = 0.35) {
    for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
            if (r <= 0 || c <= 0 || r >= baseMap.length - 1 || c >= baseMap[0].length - 1) continue;
            if (baseMap[r][c] === 1) continue; // 元々壁なら固定
            if (baseMap[r][c] === 2) continue; // パワードットなどは維持
            map[r][c] = random() < wallProbability ? 1 : 0;
        }
    }
    // プレイヤー／ゴーストの開始位置を確実に通路にする
    map[13][7] = 0;
    map[1][1] = 0;
    map[1][13] = 0;
}

let pacman;
let ghosts = [];
let dots = []; // 2次元配列: dots[行][列] = true でドットあり
let score;
let sp = 0;
let ctime = 0;
let ct = 60000;

// --- 初期化 ---
function setup() {
    createCanvas(600, 600);
    angleMode(DEGREES);
    initGame();
}

// --- メインループ ---
function draw() {
    background(0,100);
    if (mode == 0) {
        showStartScreen();
    } else if (mode == 1) {
        playGame();
        if (millis() - ctime >= ct) {
            mode = 2;
        }
    } else if (mode == 2) {
        showGameOver();
    } else if (mode == 3) {
        showClearScreen();
    }
}

// --- キー操作 ---
function keyPressed() {
    if (mode == 0 && key == " ") {
        initGame();
        mode = 1;
        ctime = millis();
    } else if (mode == 1) {
        changeDirection();
    } else if (mode == 2 && key == " ") {
        mode = 0;
    } else if (mode == 3 && key == " ") {
        mode = 0;
        cs += 500;
    }
    if (mode == 1 && key == "a") {
        pacman.speed = pacman.speed + 1;
    }
    if (mode == 1 && key == "s") {
        pacman.speed = 1;
    }
    if (mode == 1 && key == "d") {
        pacman.speed = 10;
    }
    if (mode == 1 && key == " ") {
        score -= 300;
        dots = [];
        for (let r = 0; r < map.length; r++) {
            dots.push([]);
            for (let c = 0; c < map[r].length; c++) {
            // 端のトンネルマスにはドットを置かない
            let isBorder =
                r == 0 ||
                r == map.length - 1 ||
                c == 0 ||
                c == map[r].length - 1;
            dots[r].push(map[r][c] != 1 && !isBorder);
            }
        }
    }    
}

// --- 画面表示 ---
function showStartScreen() {
    drawMap();
    drawDots();
    drawPacman();
    drawScore();
    textAlign(CENTER);
    fill("yellow");
    textSize(40);
    text("PAC-MAN", width / 2, height / 2 - 30);
    fill("white");
    textSize(18);
    text("SPACE キーでスタート", width / 2, height / 2 + 20);
}

function playGame() {
    updatePacman();
    updateGhosts();
    checkEatDots();
    checkHitGhost();
    checkClear();
    drawMap();
    drawDots();
    drawPacman();
    drawGhosts();
    drawScore();
}

function showGameOver() {
    drawMap();
    drawDots();
    drawPacman();
    drawGhosts();
    drawScore();
    textAlign(CENTER);
    fill("red");
    textSize(40);
    text("GAME OVER", width / 2, height / 2);
    fill("white");
    textSize(18);
    text("SPACE キーでタイトルへ", width / 2, height / 2 + 50);
}

function showClearScreen() {
    drawMap();
    drawDots();
    drawPacman();
    drawScore();
    textAlign(CENTER);
    fill("yellow");
    textSize(40);
    text("STAGE CLEAR!", width / 2, height / 2);
    fill("white");
    textSize(18);
    text("SPACE キーでタイトルへ", width / 2, height / 2 + 50);
}

// ゲームを初期化する
function initGame() {
    // ベースマップをコピーして、特定領域だけランダムに再生成
    copyBaseMap();
    randomizeMapSection(2, 2, 12, 12, 0.35); // 例：中心部をランダムに

    // mapの2次元配列からdotsの2次元配列を生成する
    dots = [];
    for (let r = 0; r < map.length; r++) {
        dots.push([]);
        for (let c = 0; c < map[r].length; c++) {
            // 端のトンネルマスにはドットを置かない
            let isBorder =
                r == 0 ||
                r == map.length - 1 ||
                c == 0 ||
                c == map[r].length - 1;
            dots[r].push(map[r][c] != 1 && !isBorder);
        }
    }

    pacman = {
        col: 7,
        row: 13, // 向かっているマス（列, 行）
        x: cellX(7),
        y: cellY(13), // ピクセル位置
        dir: { x: 1, y: 0 }, // 現在の進行方向
        nextDir: { x: 1, y: 0 }, // 次に曲がりたい方向
        speed: 1,
        mouthAngle: 0,
        mouthOpen: true,
    };

    ghosts = [];
    ghosts.push({
        col: 1,
        row: 1,
        x: cellX(1),
        y: cellY(1),
        dir: { x: 1, y: 0 },
        speed: 2,
        clr: color(255, 0, 0),
    });
    ghosts.push({
        col: 13,
        row: 1,
        x: cellX(13),
        y: cellY(1),
        dir: { x: -1, y: 0 },
        speed: 2,
        clr: color(255, 184, 255),
    });

    score = 300;

    sp = 0;

    if (a == 1) {
        if (b == 1) {
            if (c == 1) {
                if (d == 1) {
                    e = 1;
                }
            }
        }
    }

}

// マップを表示する (02)
function drawMap() {
    noStroke();
    for (let r = 0; r < map.length; r++){
        for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] == 1) {
                fill(0, 0, 180);
                rect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }  
    }
}

// ドットを表示する (03)
function drawDots() {
    fill(255);
    noStroke();
    for (let r = 0; r < dots.length; r++) {
        for (let c = 0; c < dots[r].length; c++) {
            if (dots[r][c] ) {
                circle(cellX(c), cellY(r), 8);
                if (map[r][c] == 2) {
                   circle(cellX(c), cellY(r), 16);
               }
            }   
        }
    }
}

// ドットを食べる判定 (04)
function checkEatDots() {
    let c = floor(pacman.x / CELL_SIZE);
    let r = floor(pacman.y / CELL_SIZE);
    if ( r < 0 || r >= dots.length || c < 0 || c >= dots[r].length) return;
    if (dots[r][c]) {
        if (map[r][c] == 2) {
           score += 90;
           sp = 1;
           time = millis();
        }
        dots[r][c] = false;
        score += 10;
    }
    if (sp == 1 && millis() - time > 10000) {
        sp = 0;
    }
   
}

// ゴーストとの当たり判定 (05)
function checkHitGhost() {
    if (sp == 0 && pacman.speed <= 50) {
      for (let i = 0; i < ghosts.length; i++) {
        let d = dist(pacman.x, pacman.y, ghosts[i].x, ghosts[i].y);
        if (d < CELL_SIZE) {
            mode = 2;
        }
      }
    }

     if (sp == 1) {
      for (let i = 0; i < ghosts.length; i++) {
        let d = dist(pacman.x, pacman.y, ghosts[i].x, ghosts[i].y);
        if (d < CELL_SIZE) {
            if (i == 0) {
                ghosts[0].x = cellX(1);
                ghosts[0].y = cellY(1);
                ghosts[0].row = 1;
            }
            if (i == 1) {
                ghosts[1].x = cellX(13);
                ghosts[1].y = cellY(1);
                ghosts[1].row = 1;
            }
        }
      }
    }
}

// 全部食べたか確認するのはやめました (06)
function checkClear() {
    if (score >= cs) {
        mode = 3; 
    }
}

// パックマンを表示する
function drawPacman() {
    pacman_shape(
        pacman.x,
        pacman.y,
        CELL_SIZE / 2 - 2,
        pacman.mouthAngle,
        pacman.dir,
    );
}

// パックマンをマスに沿って動かす
function updatePacman() {
    let tx = cellX(pacman.col);
    let ty = cellY(pacman.row);

    // 目標マスの中心に到達したら次の行き先を決める
    if (pacman.x == tx && pacman.y == ty) {
        // nextDir に曲がれるか確認する
        let nc = pacman.col + pacman.nextDir.x;
        let nr = pacman.row + pacman.nextDir.y;
        if (isPath(nc, nr)) {
            pacman.dir = { x: pacman.nextDir.x, y: pacman.nextDir.y };
        }
        // 現在の方向に進めるなら、次のマスを目標にセットする
        let fc = pacman.col + pacman.dir.x;
        let fr = pacman.row + pacman.dir.y;
        if (isPath(fc, fr)) {
            // ワープ: 端を超えたら反対側へ
            let wc = wrapCol(fc);
            let wr = wrapRow(fr);
            if (wc != fc || wr != fr) {
                // ピクセル位置をトンネルの入口にテレポートする
                pacman.x = cellX(wc) - pacman.dir.x * CELL_SIZE;
                pacman.y = cellY(wr) - pacman.dir.y * CELL_SIZE;
            }
            pacman.col = wc;
            pacman.row = wr;
        }
    }

    // 目標マスの中心に向かってピクセル移動する
    tx = cellX(pacman.col);
    ty = cellY(pacman.row);
    if (pacman.x < tx) pacman.x = min(pacman.x + pacman.speed, tx);
    else if (pacman.x > tx) pacman.x = max(pacman.x - pacman.speed, tx);
    if (pacman.y < ty) pacman.y = min(pacman.y + pacman.speed, ty);
    else if (pacman.y > ty) pacman.y = max(pacman.y - pacman.speed, ty);

    // 口の開閉アニメーション
    if (pacman.mouthOpen) {
        pacman.mouthAngle += 5;
        if (pacman.mouthAngle >= 30) pacman.mouthOpen = false;
    } else {
        pacman.mouthAngle -= 5;
        if (pacman.mouthAngle <= 0) pacman.mouthOpen = true;
    }
}

// 進む方向を変える
function changeDirection() {
    if (keyCode == LEFT_ARROW) pacman.nextDir = { x: -1, y: 0 };
    if (keyCode == RIGHT_ARROW) pacman.nextDir = { x: 1, y: 0 };
    if (keyCode == UP_ARROW) pacman.nextDir = { x: 0, y: -1 };
    if (keyCode == DOWN_ARROW) pacman.nextDir = { x: 0, y: 1 };
}

// ゴーストを表示する
function drawGhosts() {
    for (let i = 0; i < ghosts.length; i++) {
        ghost_shape(ghosts[i].x, ghosts[i].y, CELL_SIZE / 2 - 2, ghosts[i].clr);
    }
}

// ゴーストをマスに沿ってランダムに動かす
function updateGhosts() {
    let allDirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
    ];

    for (let i = 0; i < ghosts.length; i++) {
        let g = ghosts[i];
        let tx = cellX(g.col);
        let ty = cellY(g.row);

        // 目標マスの中心に到達したら次の行き先を決める
        if (g.x == tx && g.y == ty) {
            // 進める方向を集める（逆方向は除く）
            let validDirs = [];
            for (let d = 0; d < allDirs.length; d++) {
                let isReverse =
                    allDirs[d].x == -g.dir.x && allDirs[d].y == -g.dir.y;
                if (
                    !isReverse &&
                    isPath(g.col + allDirs[d].x, g.row + allDirs[d].y)
                ) {
                    validDirs.push(allDirs[d]);
                }
            }
            // 行き止まりなら逆方向に戻る
            if (validDirs.length == 0) {
                validDirs.push({ x: -g.dir.x, y: -g.dir.y });
            }
            // ランダムに方向を選んで次のマスをセットする
            let chosen = validDirs[floor(random(validDirs.length))];
            g.dir = chosen;
            let gc = g.col + chosen.x;
            let gr = g.row + chosen.y;
            // ワープ: 端を超えたら反対側へ
            let wc = wrapCol(gc);
            let wr = wrapRow(gr);
            if (wc != gc || wr != gr) {
                g.x = cellX(wc) - chosen.x * CELL_SIZE;
                g.y = cellY(wr) - chosen.y * CELL_SIZE;
            }
            g.col = wc;
            g.row = wr;
        }

        // 目標マスの中心に向かってピクセル移動する
        tx = cellX(g.col);
        ty = cellY(g.row);
        if (g.x < tx) g.x = min(g.x + g.speed, tx);
        else if (g.x > tx) g.x = max(g.x - g.speed, tx);
        if (g.y < ty) g.y = min(g.y + g.speed, ty);
        else if (g.y > ty) g.y = max(g.y - g.speed, ty);
    }
}

// スコアを表示する
function drawScore() {
    noStroke();
    fill("white");
    textAlign(LEFT);
    textSize(16);
    text("SCORE: " + score, 10, 25);
    text("TIME: " + floor((ct - (millis() - ctime)) / 1000), 10, 45);
    text("SPEED: " + pacman.speed, 10, 65);
}

// マスの列番号 → X座標（マス中心）
function cellX(col) {
    return col * CELL_SIZE + CELL_SIZE / 2;
}

// マスの行番号 → Y座標（マス中心）
function cellY(row) {
    return row * CELL_SIZE + CELL_SIZE / 2;
}

// 指定のマスが通路かどうかを返す（端は反対側へワープして判定）
function isPath(col, row) {
    let c = wrapCol(col);
    let r = wrapRow(row);
    return map[r][c] != 1;
}

// 列番号を端でワープさせる
function wrapCol(col) {
    return ((col % map[0].length) + map[0].length) % map[0].length;
}

// 行番号を端でワープさせる
function wrapRow(row) {
    return ((row % map.length) + map.length) % map.length;
}

// ============================================================
// 図形を描く関数
// ============================================================

function pacman_shape(x, y, radius, mouthAngle, dir) {
    push();
    translate(x, y);
    rotate(atan2(dir.y, dir.x));
    noStroke();
    fill(255,212,0);
     if (pacman.speed >=10) {
        fill(255,212,0);
    }
    if (sp == 1) {
        if (millis() - time < 9000) {
            fill("blue");
        }
    }
   
    arc(0, 0, radius * 2, radius * 2, mouthAngle, 360 - mouthAngle, PIE);
    pop();
}

function ghost_shape(x, y, radius, clr) {
    push();
    translate(x, y);
    noStroke();
    fill(clr);
    arc(0, 0, radius * 2, radius * 2, 180, 360);
    rect(-radius, 0, radius * 2, radius);
    fill("white");
    ellipse(-radius * 0.35, -radius * 0.1, radius * 0.5, radius * 0.65);
    ellipse(radius * 0.35, -radius * 0.1, radius * 0.5, radius * 0.65);
    fill("black");
    ellipse(-radius * 0.3, -radius * 0.05, radius * 0.25, radius * 0.35);
    ellipse(radius * 0.4, -radius * 0.05, radius * 0.25, radius * 0.35);
    pop();
}
