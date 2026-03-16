enchant();

const params = new URLSearchParams(location.search);
const time = parseFloat(params.get("Time"));
const x = parseInt(params.get("x"));

var dropTimeout;

var game;

const YOKO_MAX = 6;
const TATE_MAX = 5;

let total_combo_colors = [0, 0, 0, 0, 0];
let total_combo_count = 0;

var Drop_tmp = new Array(6);
for(let x = 0; x < 6; x++) {
    Drop_tmp[x] = new Array(5).fill(0);
}

function puzzle(){
    if(!called){
        game = new Game(716, 530);
    }

    game.preload('../image/aa.png');

    game.fps = 60;
    const swapSound = new Audio("../sound/drop_swap.mp3");
    const deleteSound = new Audio("../sound/drop_delete.mp3");

    var have_x = 0; //持っているドロップの番号(5*6)
    var have_y = 0; 
    var lastswapdrop_x;
    var lastswapdrop_y;

    var Map = new Array(6);
    var Drop = new Array(6); 
    var CheckMap = new Array(6);

    var limit = 0;
    var now_time = 0;

    total_combo_colors = [0, 0, 0, 0, 0];
    total_combo_count = 0;

    for(let x = 0; x < 6; x++) {
        Drop[x] = new Array(5).fill(0); //配列(array)の各要素に対して、要素数5の配列を作成し、0で初期化
        Map[x] = new Array(5).fill(0);
    }

    var combo_num = 1;

    game.onload = function(){
        if(!called){
            var drop = Class.create(Sprite, {
                initialize: function(x, y){
                    Sprite.call(this, 85, 85);
                    this.frame = Math.floor(Math.random()*5);
                    this.x = x;
                    this.y = y;
                    this.image = game.assets['../image/aa.png'];
                    game.rootScene.addChild(this);
                }
            });

            var map = Class.create({
                initialize: function(x, y){
                    this.x = x;
                    this.y = y;
                }
            });


            for(var i = 0; i < YOKO_MAX; i++){
                for(var j = 0; j < TATE_MAX; j++){
                    const d = new drop(90 + 88*i, 88*j);
                    d.frame = getSafeDrop(i, j);
                    Drop[i][j] = d;
                    Map[i][j] = new map(90 + 88*i, 88*j); 
                    Drop_tmp[i][j] = Drop[i][j];
                }
            }
            called = true;
            
        } else {
            for(var i = 0; i < YOKO_MAX; i++){
                for(var j = 0; j < TATE_MAX; j++){
                    Drop[i][j] = Drop_tmp[i][j];
                    Map[i][j] = new map(90 + 88*i,88*j); 
                    game.rootScene.addChild(Drop[i][j]);
                }
            }
        }
        now_time = time;


        game.rootScene.on(Event.TOUCH_START, function(e){
            console.log(e.x, e.y);
            if(!stop){
                var cousor_x = Math.floor(((e.x - 500)*1.81 - 90) / 88); //Drop[0][0]の位置が(0,0)
                var cousor_y = Math.floor(((e.y - 55)*1.81) / 88);
                have_x = cousor_x;
                have_y = cousor_y;
                // console.log(e.x, e.y);
                // console.log(have_x,have_y);
                game.rootScene.insertBefore(Drop[have_x][have_y],null); //持っているドロップを最前面に表示
                now_time = time;
                // limit = 0.00416;
                limit = 0.01666;
            }

            dropTimeout = setTimeout(function(){
                if(!stop){
                    Drop[have_x][have_y].x = 90 + 88*have_x;
                    Drop[have_x][have_y].y = 88*have_y;
                    stop = true;
                    drop_judge();
                    drop_delete();
                }
            },time*1000);

        })


        game.rootScene.on(Event.TOUCH_MOVE, function(e){
            if(!stop){
                Drop[have_x][have_y].x = (e.x - 500)*1.81 - 42; //-30によってカーソルをドロップの中央に
                Drop[have_x][have_y].y = (e.y - 55)*1.81 - 42;
                const newX = Math.floor(((e.x - 500)*1.81 - 90) / 88);
                const newY = Math.floor(((e.y - 55)*1.81) / 88);
                //console.log(cousor_x,cousor_y);

                const dx = newX - have_x;
                const dy = newY - have_y;

                if ((dx !== 0 || dy !== 0) && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                    move(dx, dy); //この1マス分だけ動かす
                }
            }
        })


        game.rootScene.on(Event.TOUCH_END, function(e){
            if(!stop){
                Drop[have_x][have_y].x = 90 + 88*have_x;
                Drop[have_x][have_y].y = 88*have_y;
                stop = true;
                limit = 0;
                //console.log("frame",Drop[2][2].frame);
                drop_judge();
                drop_delete();
            }
            if(dropTimeout !== null) {
                clearTimeout(dropTimeout);
                dropTimeout = null;
            }
        })

        const info = document.querySelector(".Time");
        if(!info.querySelector(".TimeBar")){
            info.innerHTML = `
            <div class="TimeText"></div>
            <div class="TimeBar"></div>
            `;
        }

        const TimeText = info.querySelector('.TimeText');
        const TimeBar = info.querySelector('.TimeBar');


        game.rootScene.on(Event.ENTER_FRAME,function(){
            now_time -= limit;
            // console.log(now_time);
            TimeText.textContent = `${Math.round(Math.max(0, now_time) * 10)/10}/ ${time}`;
            const TimePercentage = (now_time / time) * 100;

            TimeBar.style.width = TimePercentage + '%';
        })



        
        //↓ここから関数の定義

        function getSafeDrop(x, y) {
            let newFrame;
            let retry = 0;
            do {
                newFrame = Math.floor(Math.random() * 5);
                retry++;
            } while ((x >= 2 && Drop[x-1][y].frame === newFrame && Drop[x-2][y].frame === newFrame) || (y >= 2 &&Drop[x][y-1].frame === newFrame &&Drop[x][y-2].frame === newFrame));

            return newFrame;
        }

        function move(dx, dy) {
            const targetX = have_x + dx;
            const targetY = have_y + dy;

            if (
                targetX < 0 || targetX >= YOKO_MAX ||
                targetY < 0 || targetY >= TATE_MAX
            ) return;

            //すでにこの方向にスワップ済みなら無視
            if (lastswapdrop_x === targetX && lastswapdrop_y === targetY) return;

            swapSound.currentTime = 0;
            swapSound.play();
            Drop[targetX][targetY].tl.moveTo(Map[have_x][have_y].x, Map[have_x][have_y].y, 10);

            //入れ替え
            const temp = Drop[have_x][have_y];
            Drop[have_x][have_y] = Drop[targetX][targetY];
            Drop[targetX][targetY] = temp;

            have_x = targetX;
            have_y = targetY;

            //スワップ済み座標を記録
            lastswapdrop_x = targetX;
            lastswapdrop_y = targetY;
        }

        function drop_judge() {
            const matched = Array.from({ length: YOKO_MAX }, () => Array(TATE_MAX).fill(false));
            CheckMap = Array.from({ length: YOKO_MAX }, () => Array(TATE_MAX).fill(0));

            let foundMatch = false;

            //横に3つ以上チェック
            for (let y = 0; y < TATE_MAX; y++) {
                for (let x = 0; x < YOKO_MAX - 2; x++) {
                    let f1 = Drop[x][y].frame;
                    let f2 = Drop[x+1][y].frame;
                    let f3 = Drop[x+2][y].frame;
                    if (f1 === f2 && f2 === f3) {
                        matched[x][y] = matched[x+1][y] = matched[x+2][y] = true;
                        foundMatch = true;
                        let i = x + 3;
                        while (i < YOKO_MAX && Drop[i][y].frame === f1) {
                            matched[i][y] = true;
                            i++;
                        }
                    }
                }
            }

            //縦に3つ以上チェック
            for (let x = 0; x < YOKO_MAX; x++) {
                for (let y = 0; y < TATE_MAX - 2; y++) {
                    let f1 = Drop[x][y].frame;
                    let f2 = Drop[x][y+1].frame;
                    let f3 = Drop[x][y+2].frame;
                    if (f1 === f2 && f2 === f3) {
                        matched[x][y] = matched[x][y+1] = matched[x][y+2] = true;
                        foundMatch = true;
                        let j = y + 3;
                        while (j < TATE_MAX && Drop[x][j].frame === f1) {
                            matched[x][j] = true;
                            j++;
                        }
                    }
                }
            }

            //マッチ済みドロップをグループに
            let visited = Array.from({ length: YOKO_MAX }, () => Array(TATE_MAX).fill(false));

            for (let x = 0; x < YOKO_MAX; x++) {
                for (let y = 0; y < TATE_MAX; y++) {
                    if (matched[x][y] && !visited[x][y]) {
                        flood_fill(x, y, Drop[x][y].frame, combo_num, matched, visited);
                        combo_num++;
                    }
                }
            }


            let combo_colors = [0, 0, 0, 0, 0]; //色ごとのコンボ数
            let combo_seen = {};

            for (let x = 0; x < YOKO_MAX; x++) {
                for (let y = 0; y < TATE_MAX; y++) {
                    let id = CheckMap[x][y];
                    if (id > 0) {
                        let color = Drop[x][y].frame;
                        if (!combo_seen[id]) {
                            combo_colors[color]++;
                            combo_seen[id] = true;
                        }
                    }
                }
            }

            //console.log("色別コンボ数：", combo_colors);

            //累積に加算
            for (let i = 0; i < combo_colors.length; i++) {
                total_combo_colors[i] += combo_colors[i];
            }

            total_combo_count += combo_num - 1; //今回のコンボ数を加算
            //console.log("累積コンボ数：", total_combo_count);
            //console.log("累積色別コンボ：", total_combo_colors);

            return foundMatch;
        }

        function flood_fill(sx, sy, frameType, id, matched, visited) {
            const q = [[sx, sy]]; //探索待ちのキュー
            visited[sx][sy] = true; //探索済みにする
            CheckMap[sx][sy] = id;

            const dx = [1, -1, 0, 0]; //左右
            const dy = [0, 0, 1, -1]; //上下

            while (q.length > 0) {
                const [x, y] = q.shift();

                for (let d = 0; d < 4; d++) {
                    const nx = x + dx[d]; //こう書くことで隣接してるマスを表現
                    const ny = y + dy[d];

                    if (0 <= nx && nx < YOKO_MAX && 0 <= ny && ny < TATE_MAX) {
                        if (!visited[nx][ny] && matched[nx][ny] && Drop[nx][ny].frame === frameType) {
                            visited[nx][ny] = true; //隣接ドロップも探索済みに
                            CheckMap[nx][ny] = id;
                            q.push([nx, ny]);
                        }
                    }
                }
            }
        }


        async function sleep(delay, result) {
            return new Promise(resolve => {
                setTimeout(() => resolve(result), delay);
            });
        }

        async function drop_delete(){
            for(k = 1; k < combo_num; k++){

                for(i = 0; i < YOKO_MAX; i++){
                    for(j = 0; j < TATE_MAX; j++){
                        if(CheckMap[i][j] == k){
                            Drop[i][j].tl.fadeOut(25, enchant.Easing.QUAD_EASEINOUT);
                            deleteSound.currentTime = 0;
                            deleteSound.play();
                        }
                    }
                }

                await sleep(500);
            }

            for(let i = 0; i < YOKO_MAX; i++){
                for(let j = 0; j < TATE_MAX; j++){
                    if(CheckMap[i][j] > 0){
                        game.rootScene.removeChild(Drop[i][j]); //シーンから削除
                        Drop[i][j] = null; //nullを代入して実体もなくす
                    }
                }
            }

            await drop_fall(); //実体生成から落下処理へ
        }

        async function drop_fall(){
            for(let x = 0; x < YOKO_MAX; x++){
                for (let y = TATE_MAX - 1; y >= 0; y--) {
                    if (Drop[x][y] === null) {
                        //上から落とせるドロップを探す
                        let found = false;
                        for (let k = y - 1; k >= 0; k--) {
                            if (Drop[x][k] !== null) {
                                //見つけたらそのドロップを下に移動
                                Drop[x][y] = Drop[x][k];
                                Drop[x][k] = null;
                                Drop[x][y].tl.clear();
                                Drop[x][y].tl.moveTo(Map[x][y].x, Map[x][y].y, 20);
                                found = true;
                                break;
                            }
                        }

                        //上にドロップがなかったら新しいドロップ生成
                        if (!found) {
                            const newDrop = new drop(Map[x][y].x, -100);
                            newDrop.frame = Math.floor(Math.random() * 5);
                            Drop[x][y] = newDrop;
                            newDrop.tl.clear
                            newDrop.tl.moveTo(Map[x][y].x, Map[x][y].y, 20);
                        }
                    }
                }
            }

            combo_num = 1;
            await sleep(400);

            if(drop_judge()){
                await drop_delete(); 
            } else {
                for(var i = 0; i < YOKO_MAX; i++){
                    for(var j = 0; j < TATE_MAX; j++){ 
                        Drop_tmp[i][j] = Drop[i][j];
                    }
                }
                myTurn();
            }
        }
    }

    if(!called){
        game.start();
    }
    
    document.querySelector(".vertical").appendChild(game._element);
    game.rootScene._element.style.transform = "scale(1)";
    game.rootScene._element.style.transformOrigin = "top left";

}