;(function(){
    var winW = window.innerWidth,winH = window.innerHeight,defaultW = 375,defaultH = 667;
	var totalSecond = 30;  //游戏时间
	var score = 0;
	var gravity = 100;
	var gameOver = false;

	var imageBasePath = 'asset/';
	var score_sprite = ['jinbao','jinbi_game','yuanbao']
	var game = new Phaser.Game(defaultW,winH,Phaser.AUTO,'gameContainer');

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
			game.load.image('logo',imageBasePath+'loading/logo.png');
			game.load.image('processing',imageBasePath+'loading/processing.png');
			game.load.image('process_bg',imageBasePath+'loading/process_bg.png');
		}
        this.create = function(){
			game.state.start('preload');
		}
    }
    //预加载资源场景
    function preload(){

    }
    //游戏场景
    function play(){

    }

    game.state.add('boot',boot);
	game.state.add('preload',preload);
	game.state.add('play',play);
	game.state.start('boot');
})();
