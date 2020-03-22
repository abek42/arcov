AFRAME.registerComponent('face-colors', {
        dependencies: ['geometry'],
        schema: {
          color: {default: '#FFF'}
        },
        init: function () {
          var geometry;
          var i;
          geometry = this.el.getObject3D('mesh').geometry;
          for (i = 0; i < geometry.faces.length; i++) {
            geometry.faces[i].color.set(this.data.color);
          }
          geometry.colorsNeedUpdate = true;
        }
      });

function initVirusAnim(vir){//initialises the animation
	//this el is for continuation of motion
	if(!vir.hasLoaded){//entity not loaded properly yet, wait for it to load and call again
		//console.log("DBG: initVA> not loaded",vir.id);
		vir.addEventListener('loaded',function(){
			//console.log("DBG: initVA>post load",vir.id);
			initVirusAnim(vir);
		});		
	}
	else{
//		console.log("DBG: actVir(new):",vir.id);
		vir.addEventListener('animationcomplete',function(e){
			let animComp = e.detail.name;
			let entity   = e.target;
			if(animComp.includes("animation__f")){//reset direction, restart animation
				entity.components[animComp].data.to = -entity.components[animComp].data.to;
				entity.emit(entity.components[animComp].data.startEvents[0],false);
				//console.log("DBG: evt>anComp>",entity.id,animComp,"reset dir:",entity.components[animComp].data.to);
			}
			else{
//				console.log("DBG: evt>anComp>fall complete",entity.id);
				whObj.particles.find(p=>p.id==entity.id).state=_INACTV;
				entity.children[0].components.material.material.opacity=1;//reset for future use
				entity.setAttribute("visible",false); //hide it once it has completed its fall
			}
		});
		vir.emit(vir.components.animation__fx.data.startEvents[0],false);
		vir.emit(vir.components.animation__fy.data.startEvents[0],false);
	}
}

function updateVirusAnim(newVParticle,scaleTOX=1,scaleTOY=1){//updates the animation to specification
	if(newVParticle.hasLoaded){//previously loaded
		let miFx=document.getElementById("fx").componentCache.animation__fx.dur*1;
		let miFy=document.getElementById("fy").componentCache.animation__fy.dur*1;
		newVParticle.components.animation__fx.data.to = -newVParticle.components.animation__fx.data.to*scaleTOX;
		newVParticle.components.animation__fy.data.to = -newVParticle.components.animation__fy.data.to*scaleTOY;
		newVParticle.children[0].components.material.material.opacity=1;
		newVParticle.components.animation__fx.data.dur = wob(miFx,500);
		newVParticle.components.animation__fy.data.dur = wob(miFy,500);
	}
	else{
		console.log("DBG: updVA : ",newVParticle.id);
		newVParticle.addEventListener("loaded",function(){
			//console.log("DBG: Post: ",newVParticle.id,scaleTOX,scaleTOY);
			updateVirusAnim(newVParticle,scaleTOX,scaleTOY);
		});
	}
}

function spawnVirus(src,parentEl,posRandom=false){
	//objective is to use an old one if available, else create a new one
	//console.log("DBG: spawnVirus",src,parentEl);
	//need to establish the position
	let srcPos = src.object3D.position;
	let zPos = wob(srcPos.z,1);
	if(zPos==0||(zPos<4||zPos>10)) zPos = wob(-7,2); //clamp z-depth
	let pos0 = [srcPos.x,srcPos.y,zPos].join(" ");
	if(posRandom){//wobble around src pos
		let tmp = pos0.split(" ");
		pos0 = [wob(Math.floor(tmp[0]*1),4),wob(Math.floor(tmp[1]*1),4),tmp[2]].join(" ");
	}
//	console.log("DBG: spawnVirus> posZ:",pos0.split(" ")[2],"src",srcPos.z);
	//see if we can find an old one
	let spawnIdx=whObj.particles.findIndex(inv=>inv.isActive(_INACTV));
	let spawn=null;
	if(spawnIdx>0){
		whObj.particles[spawnIdx].state=_ACTIVE; //set it to active state
		spawn = whObj.particles[spawnIdx].node;//.splice(spawnIdx,1)[0];
		spawn.setAttribute("visible",true); //make the structure visible
		spawn.setAttribute('position',pos0);
		updateVirusAnim(spawn,Math.random()>0.7?1:-1,Math.random()>0.7?1:-1);
		spawn.emit("floatX",false);
		spawn.emit("floatY",false);
	}
	else{//get a new one
		spawn=virusFactory(src,parentEl,whObj.particles.length);
		spawn.setAttribute('position',pos0);
		whObj.particles.push(getObj(spawn));
		initVirusAnim(spawn); //since it is new, setup the listeners
	}
	
	//now we have a proper spawn ready to push
	
//	console.log("DBG: spawnVirus>activated",spawn.id,whObj.particles.length);
}

function getObj(vir){
	return {id:vir.id,state:_ACTIVE, isActive:chkState, node:vir};	
}

function virusFactory(src,scene,id){//called when new one needs to be added
		let newPos = src.object3D.position;
		
		let newVParticle = document.createElement("a-entity");
		newVParticle.setAttribute("id","cov"+(id>9?"":"0")+id);
		newVParticle.setAttribute("mixin","fx fy washOut");
		newVParticle.setAttribute("class","vParticle");
		
		newVParticle.appendChild(buildVirus());
		scene.appendChild(newVParticle);
		return newVParticle;
}

function buildVirus(){//builds the AFrame version
	let cov = document.createElement("a-entity");
	cov.setAttribute("className","cov");
	cov.setAttribute("mixin","merge Rxyz washOutV");
	cov.setAttribute("material","opacity: 0.9; transparent: true");
	cov.setAttribute("scale","0.03 0.03 0.03");
	let capNStalk='<a-entity class="capsideNStalk" rotation="0 0 0" mixin="merge">\n'+
						'\t<a-entity mixin="ator" position="0 7 0"></a-entity>\n'+
						'\t<a-entity mixin="acyl" position="0 6 0"></a-entity>\n'+
						'\t<a-entity mixin="ator" position="0 -7 0"></a-entity>\n'+
						'\t<a-entity mixin="acyl" position="0 -6 0"></a-entity>\n'+
						'\t<a-entity mixin="asph" ></a-entity>\n'+
					'</a-entity>\n';
	let stalks="";
	let i=0;
	while(i<5){
		stalks+=buildStalk(i*72);
		i++;
	}
	cov.innerHTML=capNStalk+stalks;
	return cov;
}

function buildStalk(yr,steps=4){//factored out step
	let stalks = '<a-entity class="stalks" rotation="0 #YR 0" mixin="merge">\n#STALKS\n</a-entity>';
	let stalk = '\t<a-entity class="stalk" rotation="#XR #YR #ZR" mixin="merge">\n'+
				'\t\t<a-entity mixin="ator" position="0 7 0"></a-entity>\n'+
				'\t\t<a-entity mixin="acyl" position="0 6 0"></a-entity>\n'+
				'\t</a-entity>';
	let stalkLst=[];
	let deltaT = 180/(steps+1);
	for(let i=1;i<=steps;i++){
		stalkLst.push(stalk.replace("#XR",wob(0,10)).replace("#YR",wob(0,15)).replace("#ZR",wob(0,10)+(i)*deltaT));	
	}
	return stalks.replace("#YR",wob(yr,10)).replace("#STALKS",stalkLst.join("\n"));
}

function wob(cVal,rng){//wobble... central value cVal, range on either side rng
	return cVal + Math.floor(Math.random()*2*rng+1)-rng;
	
}

