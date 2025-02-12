const _ACTIVE=0;
const _WASHED=1;
const _INACTV=2;
const _NOTIFY_WIN="WIN";
const _NOTIFY_LOSS="LOSE";

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

function chkState(refState=_ACTIVE){
	return this.state==refState;	
}

let whObj = {total:1,particles:[],washed:0,firstRun:true,game:"washHands",banner:false,trackTick:-1,
				tickInterval:10000,tick:-1,tracking:false,tickFunction:washTick,hitFunction:washHit,
				constants:{activeMax:8,washMin:10,activeMin:3},
				markerHnds:{}};
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
	document.addEventListener('markerFound',function(){//every time marker is found, this event is triggered
		if(currGameObj===null||!currGameObj.tracking){
			activateGame();
		}
		currGameObj.tracking=true;
		if(currGameObj.trackTick<0){
			currGameObj.markerHnds={tooClose:document.getElementById("tooClose"),tooFar:document.getElementById("tooFar"),
									noMarker:document.getElementById("noMarker"), markerHnd:document.querySelector("a-marker")};
			currGameObj.trackTick=setInterval(function(){
				let markerPos = currGameObj.markerHnds.markerHnd.object3D.position;//.getAttribute("position");
			//	console.log("DBG: markerPos",[markerPos.x, markerPos.y, markerPos.z].join(", "));
				if(markerPos.z<-9){
					currGameObj.markerHnds.tooFar.setAttribute("visible",true);
					currGameObj.markerHnds.tooClose.setAttribute("visible",false);
					currGameObj.markerHnds.noMarker.setAttribute("visible",false);
				}
				else{
					if(markerPos.z>-5){
						currGameObj.markerHnds.tooFar.setAttribute("visible",false);
						currGameObj.markerHnds.tooClose.setAttribute("visible",true);
						currGameObj.markerHnds.noMarker.setAttribute("visible",false);
					}	
					else{
						currGameObj.markerHnds.tooFar.setAttribute("visible",false);
						currGameObj.markerHnds.tooClose.setAttribute("visible",false);
						currGameObj.markerHnds.noMarker.setAttribute("visible",false);
					}
				}
			},250);
		}
		//otherwise the game state takes care of itself
	});
	document.addEventListener('markerLost',function(){
		//console.log("DBG: mLost",currGameObj!==null);
		if(currGameObj!==null){
			currGameObj.tracking=false;
			currGameObj.markerHnds.tooFar.setAttribute("visible",false);
			currGameObj.markerHnds.tooClose.setAttribute("visible",false);
			currGameObj.markerHnds.noMarker.setAttribute("visible",true);
			clearInterval(currGameObj.trackTick);
			currGameObj.trackTick=-1;
		}
	});
}

function positionMarker(){
	let markerPos = document.querySelector("a-marker").getAttribute("position");
	document.getElementById("pos").innerHTML =[(markerPos.x).toFixed(1),(markerPos.y).toFixed(1),(markerPos.z).toFixed(1)];
}

function activateGame(){
	currGameObj.tracking=true;//set tracking
	if(currGameObj.tick<0){//not ticking
		currGameObj.tick=setInterval(function(){
			currGameObj.tickFunction();
		},currGameObj.tickInterval);
		console.log("DBG: activeGame>hideBan");
		document.getElementById("bannerText1").emit("hideBan");
		document.getElementById("bannerText2").emit("hideBan");
	}
}

function processHit(evt){
	//console.log("DBG: processHit: ",evt.target.className, evt.target.id);	
	if(evt.target.className=="collider") return; //yes, collision event is trigged twice
	currGameObj.hitFunction(evt.target); //call the respective function 
}

function initWashHands(){
	currGameObj=whObj; //set correct gameObj
	
	if(whObj.firstRun){//populate cov00, and create cov01 and cov02
		whObj.firstRun=false;
		let v0=document.getElementById("cov00");	
		whObj.particles.push(getObj(v0));
		v0.appendChild(buildVirus());
		initVirusAnim(v0);
		spawnVirus(v0,v0.parentElement,true); //spawn a copy at some new location
		spawnVirus(v0,v0.parentElement,true); //spawn second copy at some new location
		document.getElementById("tap").components["aabb-collider"].data.enabled=true;
	}
	//show game_scene
	document.getElementById("game_washHands").setAttribute('visible',true);
}

function washTick(){
	/*Logic
		1. Create a new particle unless:
			washed equals or exceeds washMin
		2. Second check location where we check if active equals or exceeds activeMax	
			if yes, notify Lose
	*/	
	
	let active = whObj.particles.reduce((acc,particle)=>acc+(particle.isActive()?1:0),0);
	let toWin = whObj.constants.washMin - whObj.washed;
	
//	console.log("DBG: processTick","total:",whObj.particles.length,"active:",active,"washed:",whObj.washed,"toWin:",toWin);
	
	if(active>=whObj.constants.activeMax){
		displayDialog(_NOTIFY_LOSS);
		return;
	}
	
	if(toWin<=0&&active<1){
		displayDialog(_NOTIFY_WIN);
		return;
	}
	
	if(toWin>active){
		let src=whObj.particles.find(p=>p.isActive).node;
		//console.log("DBG: processHit>spawn new from", src.id);
		if(whObj.tracking){//only if tracking
			spawnVirus(src,src.parentElement,false); 
		}
	}
}

function washHit(particle){//only triggered when reducing count
	/*/Logic
		1. Set the particle up for washing
		2. Check win state first>All active gone AND minWash exceeded
		3. If win pending>we need to know if there are fewer than minActive particles remaining
			3.1 If fewer than minActive remain, 
				3.1.1 If toWin count is more than minActive, spawn new particle
	*/
	console.log("DBG: washHit>process",particle.id,particle.className);
	if(particle.className=="vReplay"){
		location.reload();
	}
	
	//move it from active to inactive, update state to indicate new washed one
	let p = whObj.particles.find(p=>p.id==particle.id);
	if(typeof(p)==="undefined") {//unexpected situation where inactive particle hits tap?
		console.log("ERR: Unexpected washHit",particle.id,whObj.particles.filter(p=>p.isActive()).map(a=>a.id).join(", "));
		return; //do nothing
	}
	//move to invisible, and increment washed count
	p.state=_WASHED;
	//trigger animation that removes the particle from view
	particle.children[0].emit("wOut");
	whObj.washed++; 
	
	let active = whObj.particles.reduce((acc, particle) => acc + particle.isActive()?1:0, 0);
	if(whObj.washed<whObj.constants.washMin){//game not won yet
		let toWin = whObj.constants.washMin-whObj.washed;
		if(active<whObj.constants.activeMin){//we fall below minimum active threshold
			//we only add a new particle if toWin exceeds active
			if(active<toWin){//if all active particles are washed, we will still not reach win state
				//find an active particle and use it to generate a new spawn
				let src=whObj.particles.find(p=>(p.isActive())).node;
//				console.log("DBG: processHit>spawn new from", src.id);
				spawnVirus(src,src.parentElement,false);				
			}		
		}
	}
	else{//min washed value reached or exceeded
		//wait till all active particles are removed
		if(active==0) displayDialog(_NOTIFY_WIN);		
	}
}


function displayDialog(notifyIntent){
//	alert("Situation: "+notifyIntent);
	
	console.log("TBD: displayDialog",notifyIntent);
	clearInterval(currGameObj.tick);

	//spawn = virusFactory({object3D:{position:{x:}}},scene,id);
	whObj.particles[0].state=_ACTIVE; //set it to active state
	spawn = whObj.particles[0].node;//.splice(spawnIdx,1)[0];
	spawn.setAttribute("visible",true); //make the structure visible
	spawn.setAttribute('position',"0 -0.25 -5");
	spawn.setAttribute('class','vReplay');
	spawn.emit("pause");
	
	document.getElementById(notifyIntent==_NOTIFY_WIN?"winText":"loseText").emit("showWin",false);
	document.getElementById(notifyIntent==_NOTIFY_WIN?"winText":"loseText").setAttribute("position","4.95 0.65 0");	
	document.getElementById("retry").emit("showWin",false);
}

function getEntity(attr,type="a-entity"){
	let entity = document.createElement(type);
	for(let i=0;i<attr.length;i++){
		entity.setAttribute(attr[i].key,attr[i].val);		
	}
	//console.log("gE",entity);
	return entity;	
}


