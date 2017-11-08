window.onload=function(){

	// 添加词语
	var add = $("#add"),
		word = $("#word");

	word.onkeydown = keydown;
	function keydown(e){
		if(e.keyCode==13){
			addWord();
		}
	}
	
	add.onclick = addWord;
	function addWord(){
		var list = $(".list");
		if(trim(word.value)!=""){
			if(list.children.length==0){
				var time = new getTime(),
					createHtml = '<div class="list-block box-block">\
	<div class="list-title">\
		<h4>点击更改词表名称</h4><time>'+ time.now("/",":") +'</time>\
	</div>\
	<div class="list-content">\
		<div class="list-word">\
		</div>\
		<button class="btn play" id="play">开始听写</button>\
	</div>\
</div>';		
				list.innerHTML = createHtml;
			}
			var listWord = $(".list-word");
			listWord.innerHTML += "<label>"+ word.value +"</label>";
			word.value="";
			$("#play").onclick = begin;
		}
	}

	// 右上用户菜单 - 已移除
	// var menuList = $("#menuList");
	// var uMenuBtn = $("#uMenuBtn");
	// uMenuBtn.onclick = function(e){
	// 	uMenuBtn.classList.add("menu-btn-active");
	// 	menuList.style.cssText = "visibility:visible;opacity:1";
	// 	e.stopPropagation();
	// }
	// document.onclick = function(e){
	// 	e.stopPropagation();
	// 	uMenuBtn.classList.remove("menu-btn-active");
	// 	menuList.style.cssText = "visibility:hidden;opacity:0";
	// }
	
	var	audio = $("#tts");
	// 自动听写函数
	var dictation = new autoDictation({
		audioElement : audio,
		over : function(isover){
			if(isover){
				var playBtn = $("#play"),
					setting = $(".setting"),
					listEle = $(".list-word");
				listEle.classList.remove("hidden");
				word.onkeydown = keydown;
				add.onclick = addWord;
				playBtn.classList.remove("btn-disabled");
				playBtn.onclick = begin;
				playBtn.innerText = "开始听写";
				setting.addEventListener("click",set);
				setting.classList.remove("setting-disabled");
			}
		}
	});

	// 设置
	var setting = $(".setting");
	setting.addEventListener("click",set);
	function set(e){
		var target = e.target,
			setOption = target.parentNode.getAttribute("data-set");
		if(setOption&&target.getAttribute("data-value")){
			var targetParent = target.parentNode.children;
			for(var i=0;i<targetParent.length;i++){
				targetParent[i].classList.remove("options-checked");
			}
			target.classList.add("options-checked");
			switch(setOption){
				case "random":
					if(dictation.config.random==1){
						target.classList.remove("switch-checked");
						target.setAttribute("data-value",0);
					}else{
						target.classList.add("switch-checked");
						target.setAttribute("data-value",1);
					}
					dictation.config.random = parseInt(target.getAttribute("data-value"));
					break;
				case "interval":
						dictation.config.interval = parseInt(target.getAttribute("data-value"));
					break;
				case "repeat":
						dictation.config.repeat = parseInt(target.getAttribute("data-value"));
					break;
				case "speed":
						dictation.config.speed = (0 +"."+ parseInt(target.getAttribute("data-value")));
					break;
				case "people":

					break;
			}
		}
	}


	function begin(){
		this.innerText = "正在听写中";
		this.classList.add("btn-disabled");
		this.onclick=null;
		setting.removeEventListener("click",set);
		setting.classList.add("setting-disabled");
		word.onkeydown = null;
		add.onclick = null;

		var listEle = $(".list-word"),
			list = listEle.children,
			arr = [];

		listEle.classList.add("hidden");

		for(var i=0;i<list.length;i++){
			arr[i] = list[i].textContent;
		}
		dictation.wordList = arr;
		dictation.begin();
	}

}



function autoDictation(obj){
	obj.over = obj.over || function(){};

	// 设置
	this.config = {
		tkk : 'http://tt.890m.com/translate_tkk.php', // google tkk
		api : 'https://translate.google.cn/translate_tts?ie=UTF-8&tl=zh-CN&total=1&idx=0&client=t&prev=input', // 使用哪个发音接口
		random : 0, // 随机
		interval : 1000, // 间隔
		repeat : 1, // 重复次数
		speed : 0.4, // 速度
	};

	this.wordList = obj.data||""; // 词语列表
	this.over = false;

	var th = this,
		deacon = obj.audioElement, // 音频元素
		currentWord, // 当前读到的词语
		alreadyList = []; // 已经听过的词语

	// 开始听写
	this.begin = function(){
		th.over = false; // 正在听写
		var nextFlag = 1, // 播放下一个词语语音的开关
			currentRepeat = this.config.repeat, // 当前重复次数
			currentWord = th.getWord(); // 当前词语
		ajax({
			method : "GET",
			url : th.config.tkk,
			success : function(tkk){ ik = tkk; } // Google translate js param 设置tkk
		});
		setTimeout(function(){
			deacon.src = th.config.api+ jk(currentWord) +"&q="+ encodeURIComponent(currentWord) +"&textlen="+ currentWord.length +"&=ttsspeed="+ th.config.speed;
			deacon.play();
			// 播放结束后
			deacon.addEventListener('ended',run);
		},th.config.interval)
		function run(e){
			if(nextFlag&&currentRepeat>1){ // 复读当前词语
				nextFlag = 0; // 避免重复触发播放结束事件
				setTimeout(function(){console.log(1,'next',currentRepeat)
					currentRepeat-=1;
					deacon.play();
					setTimeout(function(){
						nextFlag = 1;							
						if(nextFlag&&th.wordList==""&&currentRepeat==0){ console.log(3,'isover',currentRepeat);
							deacon.removeEventListener('ended',run);
							th.end();
						}
					},e.srcElement.duration*1000); // 等语音播放完后才可以播放下一个语音
				},th.config.interval)
			}else if(nextFlag&&th.wordList!=""){console.log(2,'next',currentRepeat) // 下一个词语
				nextFlag = 0;
				th.begin();
			}else if(nextFlag&&th.wordList==""){console.log(4,'isover',currentRepeat);
				deacon.removeEventListener('ended',run);
				th.end();
			}
		}
	};

	// 听写结束
	this.end = function(){
		currentRepeat = th.config.repeat; // 重置当前的重复次数
		th.over = true;
		obj.over(th.over);
	}

	// 获得词语
	this.getWord = function(){
		var position = th.config.random && Math.floor(Math.random()*th.wordList.length) || 0,
			word = th.wordList.splice(position,1);

		alreadyList.push(word[0]);
		return word[0]
	};

}