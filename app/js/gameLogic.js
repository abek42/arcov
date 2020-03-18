

let currGameObj=null;
//we start with 1, then add two more
//we then wait for marker to be found
//once marker is found, we add one every 5 seconds, continuing even if marker is lost
//till we reach a total of 10
//once 10 are spawned, we don't create new ones
//this logic is for performance and is managed by spawnVirus looking for invisible ones to repurpose

//for level to be won, 15 need to be washed (and all active to be cleared)
//we cannot let 
//for level to be lost, all 10 need to be active
//

let whObj = {total:1,active:[],washed:0,invisible:[],firstRun:true,
				tickInterval:5000,tick:-1,tracking:false,tickFunction:washTick,
				constants:{activeMax:10,washMin:15,activeMin:3}};
function initGame(task){
	//hide all first
	let gameScenes = document.getElementsByClassName("game_scene");
	for(let i=0;i<gameScenes.length;i++){
		gameScenes[i].setAttribute('visible',false); //lazy slow, but dc
	}
	if(currGameObj) clearInterval(currGameObj.tick);
	
	switch(task){
		case 'washHands':
			initWashHands(); break;
		case 'noHandsToFace':
			initNoHandsToFace(); break;
		case 'coverMouth':
			initCoverMouth(); break;
	}
}
/*
Scene start with 3 floating viruses [INFRA: Virus model]
Once a tap-marker is found, a tap is added to the scene, controlled by the marker [INFRA: Tap model]
Every time a virus touches the tap, the virus drops down out of the scene and removed
One new virus is added every 5 seconds. [CORE: orbital mechanics]
Once 15 viruses have been destroyed, replication stops
Once all viruses are removed, level is completed
If virus count reaches 3, auto-spawn unless replication is disabled
If virus count exceeds 10, level is lost
Banner: Wash your hands with soap, for at least 20 seconds
*/
function markerHandler(){
	document.addEventListener('markerFound',function(){
		activateGame();
	});
	
}

function activateGame(){
	currGameObj.tracking=true;//set tracking
	if(currGameObj.tick<0){//not ticking
		currGameObj.tick=setInterval(function(){
			currGameObj.tickFunction();
		},currGameObj.tickInterval)
	}
}

function initWashHands(){
	currGameObj=whObj; //set correct gameObj
	
	if(whObj.firstRun){//we have one virus, spawn two more
		let vO=document.getElementById("cov00");
		vO.appendChild(buildVirus());
		activateVirus(vO);
		whObj.active.push(vO);
		spawnVirus(vO,true); //spawn a copy at some new location
		spawnVirus(vO,true);
		whObj.firstRun=false;
	}
	//show game_scene
	document.getElementById("game_washHands").setAttribute('visible',true);
}

function washTick(){
	//One new virus is added every 5 seconds. If here, 5 seconds have elapsed
	//we hold the spawn count above or equal to activeMin till activeMin<washMin-washed
	if(whObj.active.length==whObj.constants.activeMax){
		notifyUser('loss');
		return;
	}
	
	if(whObj.active.length==0){
		notifyUser('win');
		return;
	}
	
	let spawnNew=(whObj.constants.washMin - whObj.washed)>whObj.constants.activeMin;
	
	if(spawnNew){
		let src=whObj.active[Math.floor(Math.random()*whObj.active.length)]
		spawnVirus(src,false); 
	}
}

function tapHitsParticle(particle){//only triggered when reducing count
	console.log("TBD: Wash particle");
	console.log("TBD: If all have been washed, notifyUser('win')");
	console.log("TBD: If active less than 4, washTick to spawn new");
}

function notifyUser(state){
	console.log("TBD: notifyUser",state);
}