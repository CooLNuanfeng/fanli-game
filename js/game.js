;(function(){
    var winW = window.innerWidth,winH = window.innerHeight,defaultW = 375,defaultH = 667;
	var totalSecond = 10;  //游戏时间
	var score = 0;
	var gravity = 100;
	var gameOver = false;

	var imageBasePath = 'asset/';
	var score_sprite = ['jinbao','jinbi_game','yuanbao']
	var game = new Phaser.Game(defaultW,winH,Phaser.AUTO,'gameContainer');

    var $mask = $('#mask');
    var $dialog = $('#sorceModal');
    var $goBtn = $('.J_go_next');



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
			game.stage.backgroundColor = 0xe43134;
			//loading
			game.load.image('jinbi',imageBasePath+'loading/jinbi.png');
			game.load.image('processing',imageBasePath+'loading/processing.png');
			game.load.image('process_bg',imageBasePath+'loading/process_bg.png');
		}
        this.create = function(){
			game.state.start('preload');
		}
    }
    //预加载资源场景
    function preload(){
        this.preload = function(){
			//game spritesheet
			game.load.spritesheet('baozha',imageBasePath+'game/baozha.png',68,67);
			game.load.spritesheet('caishen_sprite',imageBasePath+'game/caishen_sprite.png',83,102);
			game.load.spritesheet('defen_baozha',imageBasePath+'game/defen_baozha.png',52,53);
			//image
			game.load.image('bg',imageBasePath+'game/bg.png');
			game.load.image('bg_bottom',imageBasePath+'game/bg_bottom.png');
			game.load.image('jinbao',imageBasePath+'game/jinbao.png');
			game.load.image('jinbi_game',imageBasePath+'game/jinbi.png');
			game.load.image('score_bg',imageBasePath+'game/score_bg.png');
			game.load.image('time_bg',imageBasePath+'game/time_bg.png');
			game.load.image('top_icon',imageBasePath+'game/top_icon.png');
			game.load.image('top_icon_right',imageBasePath+'game/top_icon_right.png');
			game.load.image('yuanbao',imageBasePath+'game/yuanbao.png');
			game.load.image('zhadan',imageBasePath+'game/zhadan.png');
			//loading menu
			var processBg = game.add.sprite(game.width/2,game.height/2-2,'process_bg');
			var preloadSprite = game.add.sprite(game.width/2,game.height/2,'processing');
            processBg.anchor.setTo(0.5,0);
			preloadSprite.anchor.setTo(0.5,0);
			preloadSprite.visible = false;
			var loadText = game.add.text(game.width/2,game.height/2+22,'0%',{font: "bold 16px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle"});
			loadText.anchor.setTo(0.5,0);
			game.load.setPreloadSprite(preloadSprite);
			game.load.onLoadStart.add(function(){},this);
			game.load.onFileComplete.add(function(progress, cacheKey, success, totalLoaded, totalFiles){
				loadText.text = progress + '%('+totalLoaded+'/'+totalFiles+')';
			},this);
			game.load.onLoadComplete.add(function(){
                preloadSprite.destroy();
                processBg.destroy();
				loadText.destroy();
			},this);
		},
		this.create = function(){
            var timer,count = 3;
            $mask.show();
            timer = setInterval(function(){
                if(!count){
                    $mask.remove();
                    clearInterval(timer);
                    game.state.start('play');
                    return;
                }
                count--;
                $mask.children('div').html(count);
            },1000);
		}
    }
    //游戏场景
    function play(){
        this.create = function(){
            var borderSpace = 45;
			game.add.sprite(0,0,'bg');
			game.add.sprite(0,0,'top_icon');
			game.add.sprite(game.width,0,'top_icon_right').anchor.setTo(1,0);
			game.add.sprite(0,game.height,'bg_bottom').anchor.setTo(0,1);
			game.add.sprite(20,22,'time_bg');
			game.add.sprite(game.width-borderSpace+20,22,'score_bg').anchor.setTo(1,0);
            var caishen = game.add.sprite(borderSpace,70,'caishen_sprite');
            this.caishen = caishen;
			caishen.anchor.setTo(0.5,0);
            caishen.animations.add('fly');
			caishen.play('fly',2,true);
            this.caishen_tween = game.add.tween(caishen).to( { x: game.width-borderSpace }, 3000, Phaser.Easing.Linear.None, true, 0, -1, true);
            this.updateTimeEvent = game.time.events.loop(1000, this.updateTime, this);
            this.makeBallTimeEvent = game.time.events.loop(1000, this.generateBalls, this);
            this.timeText = game.add.text(96,48,totalSecond+'s',{font: "bold 26px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle"});
			this.timeText.anchor.setTo(0.5,0.5);
			this.scoreText = game.add.text(game.width-100,57,score,{font: "bold 22px Arial", fill: "#fef000", boundsAlignH: "center", boundsAlignV: "middle"});
			this.scoreText.anchor.setTo(0.5,0.5);
			this.ballGroup = game.add.group();
			this.ballGroup.enableBody = true;

			var score_explosions = game.add.group();
			this.score_explosions = score_explosions;
			score_explosions.createMultiple(30, 'defen_baozha'); // 创建30个得分效果
			score_explosions.forEach(this.setupInvader, this);

			var zhadan_explosions = game.add.group();
			this.zhadan_explosions = zhadan_explosions;
			zhadan_explosions.createMultiple(30, 'baozha');
			zhadan_explosions.forEach(this.setupInvader, this);
        }
        this.update = function(){
			this.ballGroup.forEachExists(this.checkCollide,this);
			if(gameOver || totalSecond <= 0){
				return;
			}
		}
        //出屏销毁
        this.checkCollide = function(ball){
			if(ball.y - ball.height/2 > game.height){
				ball.kill();
			}
		}

        this.setupInvader = function(invader){
			invader.anchor.x = 0.5;
			invader.anchor.y = 0.5;
			invader.animations.add('kaboom');
		}
        //游戏计时
        this.updateTime = function(){
			gravity += 10;  //下落速度
			if(totalSecond-- <= 0){
				this.gameOver();
				return;
			}
			// this.generateBalls();
			this.timeText.text =  totalSecond+'s'
		}
        // 礼品生成函数
        this.generateBalls = function(){
			this.makeBall();

			this.ballGroup.setAll('body.velocity.y', gravity); //设置每个礼品的 y 速度
		}
        //生成礼品
		this.makeBall = function(){
			var ball,ballInfo;
			var ballInfos = this.getBallInfo(4);
			for(var i = 0 , len = ballInfos.length ; i < len; i++){
				ballInfo =  ballInfos[i];
				ball = game.add.sprite(ballInfo.x, ballInfo.y, ballInfo.name, 0, this.ballGroup);
				ball.inputEnabled = true;
				ball.anchor.setTo(0.5,0.5);
				if(ballInfo.name !== 'zhadan'){
					ball.events.onInputDown.add(this.addScore,this);
				}else{
					ball.events.onInputDown.add(this.clickZhadan,this);
				}
			}
		}
        //生成礼品 算法
		this.getBallInfo = function(len){
			var row = 3;
			var rowHeight = 70;
			var randomHeight = 30;
			if(totalSecond > 22 && totalSecond < 29){
				row = 1;
				randomHeight = 40;
				rowHeight = 80;
			}else if(totalSecond > 10 && totalSecond < 23){
				row = 2;
				randomHeight = 80;
				randomHeight = 90;
			}else if(totalSecond < 11){
				row = 3;
			}

			len = len || 1;
			len = Math.min(len,4);
			var space = 5;
			var name = 'zhadan';
			var result = [];
			var x;
			var spaceWidth = game.width/11;
			var xs = [
				spaceWidth,
				spaceWidth*4,
				spaceWidth*7,
				spaceWidth*10
			];
			for(var j = 0 ; j < row ; j++){
				for(var i = 0 ; i < len ; i++){
					var curSprite = parseInt(Math.random()*space);
					if(curSprite < 3){
						name = score_sprite[curSprite];
					}
					//var cur =  Math.floor(Math.random()*xs.length);
					x = xs[i];
					//xs.splice(cur,1);
					result.push({x:x,y:this.caishen.y+this.caishen.height + rowHeight*j - Math.random()*randomHeight,name:name});
				}
			}
            console.log(result);
			return result;
		}
        //得分事件
        this.addScore = function(ball){
			this.scoreKabom(ball);
			ball.kill();
			score += 10;
			this.scoreText.text = score;
		}
        //游戏结束
		this.gameOver = function(){
			gameOver = true;
			this.caishen.animations.stop('fly');
			game.tweens.remove(this.caishen_tween);
			this.ballGroup.forEachExists(this.removeEvent,this);
			game.time.events.remove(this.updateTimeEvent);
			game.time.events.remove(this.makeBallTimeEvent);

            $dialog.show();
            $goBtn.on('click',function(){
                $dialog.hide();
                game.state.start('queue');
            });
		}
        //炸弹事件
		this.clickZhadan = function(ball){
			this.zhadanKabom(ball);
			this.gameOver();
		}
        //清楚事件
		this.removeEvent = function(ball){
			ball.events.onInputDown.removeAll();
			ball.kill();
		}
        //得分动画
        this.scoreKabom = function(alien){
			var explosions = this.score_explosions;
			var explosion = explosions.getFirstExists(false);
			explosion.reset(alien.body.x+alien.width/2, alien.body.y+alien.height/2);
			explosion.play('kaboom', 4, false, true);
		}
        //炸弹动画
		this.zhadanKabom = function(alien){
			var explosions = this.zhadan_explosions;
			var explosion = explosions.getFirstExists(false);
			explosion.reset(alien.body.x+alien.width/2, alien.body.y+alien.height/2);
			explosion.play('kaboom', 4, false, true);
		}
    }

    //排队场景页
    function queue(){
        var map,player,layer, keyDirection;
        this.x = 0; this.y = 0;
        this.init = function(){
            console.log('queue init');
            // game.stage.backgroundColor = 0xFFCC33;
        }
        this.preload = function(){
            //地图数据
            game.load.tilemap('ditu', imageBasePath+'map/mapline.json', null, Phaser.Tilemap.TILED_JSON);
            //地图 瓦片
            game.load.image('tiles', imageBasePath+'map/map.png', 16, 16);
            //人物数据
            game.load.atlas('player', imageBasePath+'game/player.png', imageBasePath+'data/player.json',Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);

            //loading....
        }
        this.create = function(){
            map = game.add.tilemap('ditu');
            map.addTilesetImage('map', 'tiles');
            layer = map.createLayer('map_line', winW, winH);
            layer.resizeWorld();

            player = game.add.sprite(0, game.world.height, 'player');
            player.anchor.setTo(0,1);
            game.physics.enable(player);
            player.body.collideWorldBounds = true;

            game.camera.follow(player);

            player.animations.add('walk');
            player.animations.play('walk',3,true);

            //游戏人物行走
            var playerRun = game.add.tween(player);
            playerRun.to({y:game.world.height - 160},1000,'Linear');
            playerRun.to({x: 200},200,'Linear');
            playerRun.to({y:game.world.height - 480},1000,'Linear');
            playerRun.to({x: 400},500,'Linear');
            playerRun.to({y:game.world.height - 580},1000,'Linear');
            playerRun.start();

            playerRun.onComplete.add(function(){
                player.animations.stop('walk',1);
                //alert('end')


                // player.inputEnabled = true;
                // player.input.enableDrag();
                // game.physics.startSystem(Phaser.Physics.ARCADE);
                // map.setCollision([1, 2 , 3]);

                // game.input.addMoveCallback(function(ev){
                //     console.log(ev);
                //
                // });

            });




        }
        this.update = function(){
            game.physics.arcade.collide(player, layer);

        }

    }


    game.state.add('boot',boot);
	game.state.add('preload',preload);
	game.state.add('play',play);
    game.state.add('queue',queue);

	game.state.start('queue');
})();
