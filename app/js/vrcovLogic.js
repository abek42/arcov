
let game={scene:null, tapWrap: null,
			siTick:-1,covoles:[],popCnt:0,spawnRings:[{d:6,c:5},{d:5,c:4},{d:4,c:3},{d:3,c:2},{d:2,c:1}],
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
	//startTimer();
}

function initTapAnim(){
	let cursor = document.getElementById("cursor");
	let tapWrap = game.tapWrap;
	document.addEventListener("click",function(evt){//transmit the click event to tap
		tapWrap.emit("clickTap");
		switch(evt.target.className){
			case "capsid":
				console.log("DBG: click>quashing capsid",evt.target.parentNode.id);
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
		console.log("qC:",target.parentNode.id,covole.tldNode.id);
		covole.vPNode.children[0].emit("wOut"); //hide the particle, also parent will push down fast
		covole.ringNode.emit("wOut",false);
		covole.state=_WASHED; 
		advanceGame(_WASHED_MOLE);
	}
}

function advanceGame(prevState){
	let spawnNew = false;
	switch(prevState){
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
	
	let unwashed = game.covoles.filter(cf=>!cf.isActive(_WASHED)).length;
	console.log("DBG: advanceGame",game.washedCnt,unwashed,game.covoles.map(cv=>cv.id+"-"+mapState(cv.state)).join(", "));
	if(game.washedCnt>=game.constants.minToWin){
		if(unwashed==0){//no active ones remain
			clearInterval(game.siTick);
			displayDialog(_NOTIFY_WIN);
		}
		//since spawn logic is in the else block, once minToWin is exceeded, spawning stops
	}
	else{//more work remains
		if(unwashed<game.constants.minActive){spawnNew=true;}
		if(spawnNew){//try to spawnNew
			let spawnSuccess = spawnCovole();
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
	console.log("TBD: displayDialog",notifyIntent);
	
}

function testMode(){
	for(let i=0;i<game.spawnRings.length;i++){
		let sr = game.spawnRings[i];
		for(let j=0;j<7;j++){
			let sph=getEntity([{key:"position",val:(sr.d*2)+" 0 0"},{key:"color",val:"#"+(j*2)+""+(j*3)+""+(j*4)}],"a-sphere");
			let rig=getEntity([{key:"rotation",val:"0 "+j*30+" 0"}],"a-entity");
			rig.appendChild(sph);
			scene.appendChild(rig);
		}
	}

}



function startTimer(){
	game.siTick=setInterval(function(){ticker();},3000);
}

function ticker(){
	console.log("Tick");
	setTimeout(function(){tPop();},Math.floor(Math.random()*100)+100);
}

function tPop(){
	let inactiveList=game.covoles.filter(cv=>cv.isActive(_INACTV));
	if(inactiveList.length>0){//pop a random one
		let rnd=Math.floor(Math.random()*inactiveList.length);//only one which is not being animated
		if(rnd>-1){
			inactiveList[rnd].state=_ACTIVE;//animating
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

function spawnCovole(){
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
	let spare = game.covoles.find(cv=>cv.isActive(_WASHED));
	if(typeof(spare)!=="undefined"){//spare available
		//set the values
		spare.rY = rY;
		spare.dX = dX;
		let prevSt = {state:spare.state,isDn:spare.covoleNode.components.animation__dn.animationIsPlaying,
						isUp:spare.covoleNode.components.animation__up.animationIsPlaying};
		spare.state = _INACTV; //it is repurposed, but inactive
	
		//update position/rotation
		//spare.tldNode.setAttribute("visible",true);
		spare.tldNode.setAttribute("rotation","0 "+spare.rY+" 0");
		
		spare.tldNode.children[0].object3D.position.x=spare.dX;
		
		spare.vPNode.children[0].components.material.opacity=1;
		spare.ringNode.components.material.opacity=1;
		console.log("DBG: spare spawn",spare.rY,spare.dX,mapState(prevSt)+">"+mapState(spare.state));
		clearInterval(game.siTick);
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
	console.log("DBG: cFactory>",id,rY,dX,gold);
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
	
	game.covoles.push({"id":id,state:_INACTV,isActive:chkState,tldNode:e,ringNode:ring,vPNode:vP,covoleNode:covole,"rY":rY,"dX":dX});
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
	let cDbg = game.covoles.find(cv=>cv.covoleNode.id==e.target.id);
	console.log("DBG: processAnim",e.detail.name,e.target.id, cDbg?mapState(cDbg.state):"NAVL");
	switch(e.detail.name){
		case "animation__up":
			if(e.target.className=="covole"){
				e.target.emit("popdn",false);
			} 
			break;
		case "animation__dn":
			if(e.target.className=="covole"){
				let covole=game.covoles.find(cv=>cv.covoleNode.id==e.target.id);
				if(covole.state==_ACTIVE){//if _WASHED, ignore change of state
					covole.state=_INACTV;
					advanceGame(_POPPED_DOWN);
				}				
			}
			break;
		case "animation__wo":
			let covole = game.covoles.find(cv=>cv.tldNode.id==e.target.id);
			console.log("DBG: animWO",mapState(covole.state));
			//covole.tldNode.setAttribute("visible",false);
			break;
		default:
			console.log("TBD: processAnimFin",e.detail.name,e.target.id,e.target.className);
	}
}

function mapState(state){
	let states=["_ACTIVE","_WASHED","_INACTV","unk","_WASHED_MOLE","_NO_MOR_ACTV","_POPPED_DOWN"];
	return states[state];
}