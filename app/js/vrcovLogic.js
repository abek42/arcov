
let game={scene:null, tapWrap: null,
			siTick:-1,siTock:-1,si:"",
			covoles:[],popCnt:0,spawnRings:[{d:6,c:5},{d:5,c:4},{d:4,c:3},{d:3,c:2},{d:2,c:1}],
			washedCnt:0, constants:{minToWin:8,minActive:3}
		 };

function gameInit(){
	game.scene = document.querySelector("a-scene");
	game.tapWrap = document.getElementById("tapWrap");
	let srCnt = game.spawnRings[0].c;
	while(srCnt>0){
		spawnCovole();
		srCnt--;
	}	
	startTimer();
}

function initTapAnim(){
	let cursor = document.getElementById("cursor");
	let tapWrap = game.tapWrap;
	document.addEventListener("click",function(evt){//transmit the click event to tap
		tapWrap.emit("clickTap");
		switch(evt.target.className){
			case "capsid":
				//console.log("DBG: click>quash",evt.target.parentNode.id);
				quashCovole(evt.target); break;
			case "confirm":
				location.reload(); break;//restart game
			default:
				//console.log("INFO: click",evt.target.className, evt.target.id);
		}
	});
	
	cursor.addEventListener("fusing",function(evt){//t
		tapWrap.emit("fusingTap");
	});
	
	cursor.addEventListener("mouseleave",function(evt){
		tapWrap.emit("mouseleaveTap");
	});
}

function quashCovole(target){
	//console.log("DBG: quashCovole",target.parentNode.id,target.className);
	if(target.className=="capsid"){
		let covole = game.covoles.find(cv=>cv.covoleNode.id==target.parentNode.id);
		let preState = covole.state;
		covole.setState(_WASHED); //we consider it quashed
//		console.log("DBG: quashCovole:",covole.covoleNode.id,"transition:",mapState(preState)+">"+mapState(covole.state));
//		console.log("DBG emit wOut>vP.child",covole.covoleNode.id);
		covole.vPNode.children[0].emit("wOut"); //hide the particle, also covole will push down fast
//		console.log("DBG emit wOut>ring",covole.covoleNode.id);
		covole.ringNode.emit("wOut",false);//hide the covole ring
		advanceGame({state:_WASHED_MOLE,prevCovole:covole.covoleNode.id});
	}
}

function advanceGame(prev){
	let spawnNew = false;
	switch(prev.state){
		case _WASHED_MOLE:
			game.washedCnt++; //add one more
			break;
		case _POPPED_DOWN:
			game.popCnt++;
			if(game.popCnt%2==0) spawnNew = true; 
			break;
		default:
			console.log("TBD: advanceGame:state > ",prevState);
	}
	//debug statements next two
	let covoleStates = [{st:_INACTV,cnt:game.covoles.filter(cf=>cf.isActive(_INACTV)).length},
						{st:_ACTIVE,cnt:game.covoles.filter(cf=>cf.isActive(_ACTIVE)).length},
						{st:_WASHED,cnt:game.covoles.filter(cf=>cf.isActive(_WASHED)).length}];
	
//	console.log("DBG: advanceGame: washed",game.washedCnt,covoleStates.map(cs=>mapState(cs.st)+": "+cs.cnt).join(", "));
	
	let unwashed = game.covoles.filter(cf=>!cf.isActive(_WASHED)).length;
	if(game.washedCnt>=game.constants.minToWin){
		if(game.siTick>0){
			clearInterval(game.siTick);
			game.siTick=-1; //stop ticking up at normal pace,
			//tick faster
			game.siTock=setInterval(function(){ticker();},1200);
			game.si="GameTock";
		}
		if(unwashed==0){//no active ones remain
			clearInterval(game.siTock);//ticking is needed to push vP up			
			displayDialog(_NOTIFY_WIN);
		}
		//since spawn logic is in the else block, once minToWin is exceeded, spawning stops
	}
	else{//more work remains
		if(unwashed<=game.constants.minActive){
			console.log("DBG: advanceGame>covoleUNF>",prev.prevCovole,unwashed);
			spawnNew=true;}
		if(spawnNew){//try to spawnNew
			let spawnSuccess = spawnCovole(prev.prevCovole);
			if(!spawnSuccess){//no more space to spawn a mole
				clearInterval(game.siTick);
				displayDialog(_NOTIFY_LOSS);
			}
		}
	}
	
	/*/win conditions:
	//overall minimum 8 need to be removed to win the game, 5 initial and 3 other.
	//additionally, all active ones need to be removed

	//spawnConditions
		//if minToWin is reached but active covoles remain, pop-down doesn't spawn new covoles
		//else, every second unsuccessful pop-down, a new one is spawned
			//spawn location is produced as closing rings towards the player
	
	//lose conditions:
		//if all the ring-slots are exhausted and a new spawn is requested
	*/
}

function displayDialog(notifyIntent){
//	alert("Situation: "+notifyIntent);
	
	console.log("TBD: displayDialog",notifyIntent);
	

	let covole=getEntity([{key:"id",val:"retry"},{key:"class",val:"retryCovole"},{key:"position",val:"0 0 0"},{key:"mixin",val:"popup"}]);
	let hitBox = getEntity([{key:"geometry",val:"segments-radial:6"},{key:"position",val:"0 0 0"},{key:"radius",val:"0.85"},
							{key:"class",val:"confirm"},{key:"material",val:"side:double;transparent:true;opacity:0.02"}],"a-cylinder");
	let vP = virusFactory(100);

	covole.appendChild(vP);
	covole.appendChild(hitBox);
	
	document.getElementById("retryButton").appendChild(covole);
	covole.emit("popup");
	
	
	document.getElementById("retry").emit("showWin",false);	
	document.getElementById(notifyIntent==_NOTIFY_WIN?"winText":"loseText").emit("showWin",false);
	document.getElementById(notifyIntent==_NOTIFY_WIN?"winText":"loseText").setAttribute("position","4.95 3.65 0");	
	
}


function startTimer(){
	game.si="GameTick";
	game.siTick=setInterval(function(){ticker();},3000);
	document.getElementById("bannerText1").emit("hideBan");
	document.getElementById("bannerText2").emit("hideBan");
}

function ticker(){
	console.log("INFO:",game.si);
	setTimeout(function(){tPop();},Math.floor(Math.random()*100)+100);
}

function tPop(){
	let inactiveList=game.covoles.filter(cv=>cv.isActive(_INACTV));
	if(inactiveList.length>0){//pop a random one
		let rnd=Math.floor(Math.random()*inactiveList.length);//only one which is not being animated
		if(rnd>-1){
			//console.log("DBG: emit popup",inactiveList[rnd].covoleNode.id, "pre-emit",mapState(inactiveList[rnd].state) );
			inactiveList[rnd].setState(_ACTIVE);//animating
			inactiveList[rnd].covoleNode.emit("popup");
		}
	}
	else{//no more active ones remain
		//advanceGame(_NO_MOR_ACTV);				
	}		
}

function getRandomPos(){
	let dist = Math.floor(Math.random()*8)+4; //3 to 11m
	let ryo = 90- Math.floor(Math.random()*7.5)*24; //7-8 random positions between -90 -> 90
	return {rY:ryo,dX:dist};
}

function spawnCovole(avoid="NOTHING"){
	if(game.spawnRings.length==0) return false;
	
	let ring = game.spawnRings[0];
	
	//determine rY,dX
	let dX = ring.d*2;
	let rY = wob(3,2)*30; 
		
	//set a unique rotation
	while(game.covoles.findIndex(cv=>(!cv.isActive(_WASHED)&&(cv.rY==rY)&&(cv.dX==dX)))>-1){
		rY = wob(3,3)*30;
	}
	
	//se if spare is available
	let spare = game.covoles.find(cv=>cv.isActive(_WASHED)&&(cv.covoleNode.id!=avoid));
	if(typeof(spare)!=="undefined"){//spare available
		//set the values
		spare.rY = rY;
		spare.dX = dX;
		let prevSt = {state:spare.state,isDn:spare.covoleNode.components.animation__dn.animationIsPlaying,
						isUp:spare.covoleNode.components.animation__up.animationIsPlaying};
		spare.setState(_INACTV); //it is repurposed, but inactive
	
		//update position/rotation
		//spare.tldNode.setAttribute("visible",true);
		spare.tldNode.setAttribute("rotation","0 "+spare.rY+" 0");
		
		spare.tldNode.children[0].object3D.position.x=spare.dX;
		
		spare.vPNode.children[0].components.material.material.opacity=1;
		spare.ringNode.components.material.material.opacity=1;
		//console.log("DBG: spawnCovole> using spare",spare.covoleNode.id,"transition",mapState(prevSt.state)+">"+mapState(spare.state));
		//clearInterval(game.siTick);
	}
	else{//new spawn
		game.scene.appendChild(covoleFactory(game.covoles.length,rY,dX,false));
	}
	
	ring.c--;
	if(ring.c==0) game.spawnRings.shift(); //remove the first ring
	return true;
}

function covoleFactory(id,rY,dX,gold=false){
	/*
	scene > 
			e > 
				dolly >
						ring
						covole >
								 vParticle
								 hitbox
					
	
	*/
	//console.log("DBG: cFactory>",id,rY,dX,gold);
	/*,
						{key:"mixin",val:"washOutE"},{key:"material",val:"transparent:true;opacity:1;"}*/
	let e=getEntity([{key:"id", val:"vNh"+(id>9?"":"0")+id},{key:"rotation", val:[0,rY,0].join(" ")}]);
	let rig=getEntity([{key:"id", val:"rig"+(id>9?"":"0")+id},{key:"position", val:[dX,0,0].join(" ")},
						{key:"material",val:"transparent:true;opacity:1;"}]);
	
	let ring=getEntity([{key:"color", val:gold?"red":"green"},{key:"open-ended", val:"true"},{key:"position", val:"0 -0.3 0"},
						{key:"mixin",val:"washOutE"},{key:"material", val:"side:double"}],"a-cylinder");
	let covole=getEntity([{key:"id",val:"covole"+(id>9?"":"0")+id},{key:"class",val:"covole"},{key:"position",val:"0 -1 0"},{key:"mixin",val:"popup"}]);
	let hitBox = getEntity([{key:"geometry",val:"segments-radial:6"},{key:"position",val:"0 0 0"},{key:"radius",val:"0.85"},
							{key:"class",val:"capsid"},{key:"material",val:"side:double;transparent:true;opacity:0.02"}],"a-cylinder");
	let vP = virusFactory(id);

	covole.appendChild(vP);
	covole.appendChild(hitBox);
	
	covole.addEventListener("animationcomplete",function(e){processAnimFin(e);});
	
	rig.appendChild(ring);
	rig.appendChild(covole);
	
	e.appendChild(rig);
	e.addEventListener("animationcomplete",function(e){processAnimFin(e);});
	
	game.covoles.push({"id":id,state:_INACTV,isActive:chkState,"setState":setState,tldNode:e,ringNode:ring,vPNode:vP,covoleNode:covole,"rY":rY,"dX":dX});
	return e;
}

function getEntity(attr,type="a-entity"){
	let entity = document.createElement(type);
	for(let i=0;i<attr.length;i++){
		entity.setAttribute(attr[i].key,attr[i].val);		
	}
	//console.log("gE",entity);
	return entity;	
}

function processAnimFin(e){
	let covole = game.covoles.find(cv=>cv.covoleNode.id==e.target.id);
//	console.log("DBG: processAnimFin",e.detail.name,e.target.id, covole?covole.covoleNode.id+" : "+mapState(covole.state):"NAVL");
	switch(e.detail.name){
		case "animation__up"://if up animation is completed, then we start the dn animation (to occur after a delay)
			if(e.target.className=="covole"){
				//console.log("DBG: emit popdn",covole.covoleNode.id);
				e.target.emit("popdn",false);
			} 
			break;
		case "animation__dn":
			if(e.target.className=="covole"){
				if(covole.state==_ACTIVE){//if _WASHED, ignore change of state
					covole.setState(_INACTV);
					advanceGame({state:_POPPED_DOWN,prevCovole:covole.covoleNode.id});
				}
				//else{
					//console.log("DBG: processAnimFine> dn>ignore late dn",covole.covoleNode.id,mapState(covole.state));
				//}				
			}			
			break;
		case "animation__dnfast":
			//if(e.target.className=="covole"){
				//console.log("DBG: processAnimFin>dnFast>noAction",covole.covoleNode.id,mapState(covole.state));				
			//}
			break;
		case "animation__wo":
			//if(!covole) covole = game.covoles.find(cv=>cv.tldNode.id==e.target.id);
			//console.log("DBG: processAnimFin>animWO",covole.covoleNode.id,mapState(covole.state));
			//covole.tldNode.setAttribute("visible",false);
			break;
		default:
			console.log("TBD: processAnimFin> anim:",e.detail.name,e.target.id,e.target.className,covole?covole.covoleNode.id:"not covole");
	}
}

function mapState(state){
	let states=["_ACTIVE","_WASHED","_INACTV","unk","_WASHED_MOLE","_NO_MOR_ACTV","_POPPED_DOWN"];
	return states[state];
}
