;(function(){
    var winW = window.innerWidth,winH = window.innerHeight;

    var playerStep = 0; //上一次走的位置

	var totalSecond = 10;  //游戏时间
	var score = 0;  //本次游戏获得的前进卡 个数
    var allScore = 0; //累计获得前进卡个数
    var allQcode = 0; //累计获得 抽奖码个数
	var gameOver = false; //单局结束
    var dayGameOver = false; //一天 3 次结束
    var gravity = 100;
    var sendScoreCount = 0; // 已发卡券计数统计
    var currentGame = 0;  //当前是第几次游戏

    var playerMain = true; //自己玩，非帮好友玩

	var imageBasePath = 'asset/';
	var game = new Phaser.Game(winW,winH,Phaser.AUTO,'gameContainer');

    var $failModal = $('#failModal'); //没有得分弹层
    var $failClose = $('.J_fail_close');

    var $cardModal = $('#cardModal'); //获得前进卡弹层
    var $cardClose = $('.J_card_close');

    var $qcodeModal = $('#qcodeModal'); //获得抽奖码弹层
    var $qcodeClose = $('.J_qcode_close');

    var $topMask = $('#topMask'); //顶部数量显示

    var $gameBtn = $('#gameBtn'); //游戏开始开关控制



    var pathEnd = false; //是否走到地图 顶部

    //轨迹点位置数组
    var pointerArr = [
        {x: 90, y: 40},
        {x: 100, y: 100},
        {x: 85, y: 170},
        {x: 45, y: 230},
        {x: -20, y: 265},
        {x: -80, y: 310},
        {x: -150, y: 370},
        {x: -150, y: 450},
        {x: -140, y: 500},
        {x: -85, y: 540}, //10
        {x: 90, y: 690},
        {x: 100, y: 760},
        {x: 40, y: 800},
        {x: 15, y: 875},
        {x: -65, y: 890},
        {x: -115, y: 950},
        {x: -155, y: 1030},
        {x: -120, y: 1100},
        {x: -50, y: 1150},
        {x: 10, y: 1200},
    ];

    //初始场景
    function boot(){
        this.init = function(){
			if(!game.device.desktop){
				game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
				game.scale.forcePortrait = true;
			}else{
				game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			}
			//游戏居中
			game.scale.pageAlignHorizontally = true;
			game.scale.pageAlignVertically = true;
			game.scale.refresh();
		}
        this.preload = function(){
            // game.load.image('mm',imageBasePath+'mm.png');
			game.stage.backgroundColor = 0xd0e4cb;
		}
        this.create = function(){
			game.state.start('preload');
		}
    }
    //预加载资源场景
    function preload(){
        var smileAudio,boomAudio,timebg;
        var titleHead,numberCount;
        var bg,player;
        this.preload = function(){
            game.load.image('bg',imageBasePath+'bg.jpg');
            game.load.image('kabao',imageBasePath+'kabao.png');
            game.load.image('titleDjs',imageBasePath+'time-banner.png');
            game.load.image('timebg',imageBasePath+'time-bg.png');
            game.load.spritesheet('number',imageBasePath+'number.png',213,266);
            game.load.spritesheet('defen_baozha',imageBasePath+'defen_baozha.png',104,106);
            game.load.spritesheet('baozha',imageBasePath+'baozha.png',136,134);
            game.load.audio('smile',imageBasePath+'smile.wav');
            game.load.audio('boom',imageBasePath+'boom.wav');
            game.load.spritesheet('startBtn',imageBasePath+'startbtn.png',136,150);
            game.load.image('player', imageBasePath+'player.png');
            game.load.image('dialogok',imageBasePath+'medal.png');
            game.load.image('dialogfail',imageBasePath+'medal-fail.png');
            game.load.spritesheet('close',imageBasePath+'close.png',65,63);
            game.load.image('card',imageBasePath+'dialog-card.png');
            game.load.image('qcode',imageBasePath+'dialog-code.png');



            // var mm = game.add.image(100,10,'mm');
            // game.load.setPreloadSprite(mm);

            var loadText = game.add.text(game.width/2,game.height/2+22,'loading... (0%)',{font: "bold 16px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle"});
			loadText.anchor.setTo(0.5,0);
            game.load.onFileComplete.add(function(progress){
				loadText.text = 'loading... '+ '('+progress+'%)';
			},this);
			game.load.onLoadComplete.add(function(){
                loadText.text = 'loading... '+ '(100%)';
				setTimeout(function(){
                    // mm.destroy();
                    loadText.destroy();
                    $gameBtn.show();
                },200);
			},this);
		},
		this.create = function(){
            var _this = this;
            // bg = game.add.image(game.world.centerX, game.world.height,'bg');
            // bg.scale.setTo(0.5);
            // bg.anchor.setTo(0.5,1);
            // game.world.setBounds(0, 0, game.width, game.height);
            bg = game.add.image(game.world.centerX, game.world.height,'bg');
            bg.scale.setTo(0.5);
            bg.anchor.setTo(0.5,1);

            player = game.add.image(game.world.centerX + 85, game.world.height, 'player');
            player.scale.setTo(0.5);
            player.anchor.setTo(0,1);
            game.camera.follow(player);
            //采用div 开关控制
            $gameBtn.on('click',function(){
                if(currentGame > 2 || $gameBtn.hasClass('end-btn')){
                    timebg.destroy();
                    $gameBtn.removeClass('again-btn').addClass('end-btn');
                    showBtns(allScore,Math.floor(playerStep/10));
                    return;
                }
                currentGame++;
                if($gameBtn.hasClass('start-btn')){
                    $gameBtn.hide().removeClass('start-btn').addClass('again-btn');
                    $('.game-btn').hide();

                    bg.alpha = 0.2;
                    game.stage.backgroundColor = 0x000000;
                    console.log(game.world.centerX,game.world.height,player.x,player.y);
                    player.alpha = 0;
                    $topMask.hide();

                    titleHead = game.add.image(game.world.centerX, 20, 'titleDjs');
                    titleHead.scale.setTo(0.45);
                    titleHead.anchor.setTo(0.5,-1);
                    numberCount = game.add.sprite(game.width/2,game.height/2,'number',2);
                    numberCount.scale.setTo(0.5);
                    numberCount.anchor.setTo(0.5);
                    var timer,count = 2;
                    clearInterval(timer);
                    timer = setInterval(function(){
                        if(count<=0){
                            clearInterval(timer);
                            titleHead.destroy();
                            numberCount.destroy();
                            _this.play();
                            return;
                        }
                        count--;
                        numberCount.frame = count;
                    },1000);
                    return;
                }
                if($gameBtn.hasClass('again-btn')){

                    game.time.events.remove(_this.updateTimeEvent);
                    game.time.events.remove(_this.makeBallTimeEvent);
                    smileAudio.destroy();
                    boomAudio.destroy();

                    timebg.destroy();
                    $gameBtn.hide();
                    $topMask.hide();
                    $('.game-btn').hide();

                    game.world.setBounds(0, 0, game.width, game.height);
                    bg.destroy();
                    player.destroy();
                    bg = game.add.image(game.world.centerX, game.world.height,'bg');
                    bg.scale.setTo(0.5);
                    bg.anchor.setTo(0.5,1);

                    bg.alpha = 0.2;
                    game.stage.backgroundColor = 0x000000;
                    titleHead = game.add.image(game.world.centerX, 20, 'titleDjs');
                    titleHead.scale.setTo(0.45);
                    titleHead.anchor.setTo(0.5,-1);
                    numberCount = game.add.sprite(game.width/2,game.height/2,'number',2);
                    numberCount.scale.setTo(0.5);
                    numberCount.anchor.setTo(0.5);
                    var timer,count = 2;
                    clearInterval(timer);
                    timer = setInterval(function(){
                        if(count<=0){
                            clearInterval(timer);
                            titleHead.destroy();
                            numberCount.destroy();
                            _this.play();
                            return;
                        }
                        count--;
                        numberCount.frame = count;
                    },1000);
                    return;
                }
            });
        }
        this.play = function(){
            totalSecond = 10;
            sendScoreCount = 0;
            score = 0;
            gameOver = false; //单局结束
            gravity = 100;

            smileAudio = game.add.audio('smile',1);
            boomAudio = game.add.audio('boom',1);
            timebg = game.add.image(20,20,'timebg');
            timebg.scale.setTo(0.5);

            this.updateTimeEvent = game.time.events.loop(1000, this.updateTime, this);
            this.makeBallTimeEvent = game.time.events.loop(800, this.generateBalls, this);
            this.timeText = game.add.text(90,30,totalSecond+'s',{font: "normal 12px Arial", fill: "#000", boundsAlignH: "center", boundsAlignV: "middle"});
            this.timeText.anchor.setTo(0.5,0.5);
            // this.scoreText = game.add.text(game.width-100,57,score,{font: "bold 22px Arial", fill: "#fef000", boundsAlignH: "center", boundsAlignV: "middle"});
            // this.scoreText.anchor.setTo(0.5,0.5);
            this.ballGroup = game.add.group();
            this.ballGroup.enableBody = true;
        }
        //游戏计时
        this.updateTime = function(){
			gravity += 20;  //下落速度
			if(totalSecond-- <= 0){
				this.gameOver();
				return;
			}
			this.timeText.text =  totalSecond+'s'
		}
        // 礼品生成函数
        this.generateBalls = function(){
            if(gameOver){
                return;
            }
			this.makeBall();
			this.ballGroup.setAll('body.velocity.y', gravity); //设置每个礼品的 y 速度
		}
        //生成礼品
		this.makeBall = function(){
			var ball,ballInfo;
			var ballInfos = this.getBallInfo();
			for(var i = 0 , len = ballInfos.length ; i < len; i++){
                var random = Math.random(),randomScale;
                if(random < 0.25){
                    randomScale = 0.25;
                }
                if(random > 0.45){
                    randomScale = 0.45;
                }
				ballInfo =  ballInfos[i];
				ball = game.add.sprite(ballInfo.x, 0, 'kabao', 0, this.ballGroup);
                ball.scale.setTo(randomScale);
				ball.inputEnabled = true;
				ball.anchor.setTo(0.5,0.5);
				if(ballInfo.name == 'addScore'){
					ball.events.onInputDown.add(this.addScore,this);
				}else{
					ball.events.onInputDown.add(this.emptyScore,this);
				}
			}
		}
        //生成礼品 算法
		this.getBallInfo = function(){
			var result = [];
            var len = Math.floor(Math.random()*5+1);// 每秒 产生 1 - 5个
            for(var i=0; i<len; i++){
                var probability = Math.floor(Math.random()*1+1); //概率 25%   //100%
                var json = {
                    x : Math.floor(Math.random()*(winW-80) + 50)
                }
                if(probability == 1 && sendScoreCount<9){
                    json.name = 'addScore';
                    sendScoreCount ++;
                }else{
                    json.name =  'emptyScore';
                }
                result.push(json);
            }
            // console.log(result);
            return result;
		}
        //得分
        this.addScore = function(ball){
            if(!ball.clickflag){
                smileAudio.play();
                ball.loadTexture('defen_baozha', 0, false);
                var kaboom = ball.animations.add('kaboom', [0, 1]);
                ball.play('kaboom', 4, false, true);
                kaboom.onComplete.add(function(){
                    ball.kill();
                },this);
                score += 1;
                // this.scoreText.text = score;
            }
            ball.clickflag = true;
        }
        this.emptyScore = function(ball){
            if(!ball.clickflag){
                boomAudio.play();
                ball.loadTexture('baozha', 0, false);
                var empkaboom = ball.animations.add('baozha', [0, 1]);
                ball.play('baozha', 4, false, true);
                empkaboom.onComplete.add(function(){
                     ball.kill();
                },this);
            }
            ball.clickflag = true;
        }
        //游戏结束
		this.gameOver = function(){
            allScore += score;
            var _this = this;
			gameOver = true;
			game.time.events.remove(this.updateTimeEvent);
            setTimeout(function(){
                bg.alpha = 1;
                game.stage.backgroundColor = 0xd0e4cb;
                console.log(score,sendScoreCount,currentGame);
                if(score == 0) { //一个没得到
                    $failModal.show();
                    $failClose.off('click');
                    $failClose.on('click',function(){
                        $failModal.hide();
                        $gameBtn.trigger('click');
                    });
                }else{  //已获得前进卡 弹层提示
                    timebg.destroy();
                    _this.timeText.destroy();
                    game.time.events.remove(_this.makeBallTimeEvent);
                    _this.ballGroup.forEachExists(_this.removeEvent,_this);
                    smileAudio.destroy();
                    boomAudio.destroy();
                    if(playerMain){ //自己玩的
                        $('.card-text').find('strong,span').html(score);
                        $cardModal.show();
                        $cardClose.off('click');
                        $cardClose.on('click',function(){
                            $cardModal.hide();
                            _this.queue(score);
                        });
                    }else{  //帮好友玩

                    }
                }
            },2000);
		}
        //清楚事件
		this.removeEvent = function(ball){
			ball.events.onInputDown.removeAll();
			ball.kill();
		}


        this.queue = function(score){
            var tmpStep = playerStep; //人物起始点
            console.log(tmpStep,'start init point');
            var playerRun;
            var leftStep; //剩余步数
            playerStep += score;

            //ajax 同步数据
            // $.ajax('http://localhost');
            bg.destroy();
            game.world.setBounds(0, 0, 900, 1334);
            bg = game.add.image(game.world.centerX, game.world.height,'bg');
            bg.scale.setTo(0.5);
            bg.anchor.setTo(0.5,1);

            console.log(playerStep,score,'step');

            if(currentGame>1){ //非第一次游戏
                console.log('senc');
                var stepcur = tmpStep-1 < 0 ? 0 : tmpStep-1;
                player = game.add.image(game.world.centerX + pointerArr[stepcur].x, game.world.height - pointerArr[stepcur].y, 'player');
                player.scale.setTo(0.5);
                player.anchor.setTo(0,1);
                game.camera.follow(player);
                //游戏人物行走
                playerRun = game.add.tween(player);
                for(var i=0; i<score; i++){
                    var curPoint = tmpStep+i;
                    if(curPoint < 19){
                        playerRun.to({x:game.world.centerX + pointerArr[curPoint].x, y:game.world.height - pointerArr[curPoint].y},500,'Linear');
                    }else{
                        pathEnd = true;
                        leftStep = curPoint - 20;
                    }
                }

            }else{
                console.log('first');
                player = game.add.image(game.world.centerX + 85, game.world.height, 'player');
                player.scale.setTo(0.5);
                player.anchor.setTo(0,1);
                game.camera.follow(player);
                //游戏人物行走
                playerRun = game.add.tween(player);
                for(var i=0; i<score; i++){
                    playerRun.to({x:game.world.centerX + pointerArr[i].x, y:game.world.height - pointerArr[i].y},500,'Linear');
                }
            }

            playerRun.start();
            playerRun.onComplete.add(function(){
                if(pathEnd){
                    bg.destroy();
                    bg = game.add.image(game.world.centerX, game.world.height,'bg');
                    bg.scale.setTo(0.5);
                    bg.anchor.setTo(0.5,1);
                    player.destroy();
                    player = game.add.image(game.world.centerX + 85, game.world.height, 'player');
                    player.scale.setTo(0.5);
                    player.anchor.setTo(0,1);
                    game.camera.follow(player);

                    // playerRun.stop();
                    playerRun = game.add.tween(player);
                    for(var i=0; i<leftStep; i++){
                        playerRun.to({x:game.world.centerX + pointerArr[i].x, y:game.world.height - pointerArr[i].y},500,'Linear');
                    }
                    playerRun.start();
                    showBtns(allScore,Math.floor(playerStep/10));
                    return;
                }
                if(playerStep > 10){
                    allQcode += Math.floor(playerStep/10);
                    $('.qcode-text').find('strong').html(Math.floor(playerStep/10));
                    $qcodeModal.show();
                    $qcodeClose.on('click',function(){
                        $qcodeModal.hide();
                        $('.share-btn').addClass('active').find('span').html('邀请好友帮你抢更多的返利前行卡~ 好友新开局你将额外获得一个抽奖码呦');
                        showBtns(allScore,Math.floor(playerStep/10));
                    });
                }else{
                    $('.share-btn').addClass('active').find('span').html('还差'+(10-playerStep)+'张前行卡就可以获得1个抽奖码，快去邀请好友帮你吧!');
                    showBtns(allScore,Math.floor(playerStep/10));
                }
                //ajax 记录
                //
            },this);
        }

    }




    game.state.add('boot',boot);
	game.state.add('preload',preload);

	game.state.start('boot');

    function showBtns(card,qcode){
        $('.J_card_number').html(card);
        $('.J_qcode_number').html(qcode);
        $('.game-btn').show();
        $topMask.show();
        if(currentGame < 3 ){
            $gameBtn.show();
        }else{
            dayGameOver = true;
            $('.share-btn').addClass('active').find('span').html('你今天的三次游戏机会已用完，想要获得更多抽奖码就快快邀请好友帮忙吧！');
            $gameBtn.removeClass('again-btn').addClass('end-btn').show();
        }
    }

})();
