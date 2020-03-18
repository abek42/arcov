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

function updateAnimation(newVParticle,scaleTOX=1,scaleTOY=1){//updates the animation to specification
	if(newVParticle.hasLoaded){//previously loaded
		newVParticle.components.animation__fx.data.to = -newVParticle.components.animation__fx.data.to*scaleTOX;
		newVParticle.components.animation__fy.data.to = -newVParticle.components.animation__fy.data.to*scaleTOY;
	}
	else{
		console.log("DBG: Pre : ",newVParticle.id,scaleTOX,scaleTOY);
		newVParticle.addEventListener("loaded",function(){
			console.log("DBG: Post: ",newVParticle.id,scaleTOX,scaleTOY);
			newVParticle.components.animation__fx.data.to = -newVParticle.components.animation__fx.data.to*scaleTOX;
			newVParticle.components.animation__fy.data.to = -newVParticle.components.animation__fy.data.to*scaleTOY;
			newVParticle.components.animation__fy.data.dur += wob(2000,300);
			newVParticle.components.animation__fx.data.dur += wob(2000,300);
		});
	}
}

function activateVirus(vir){//initialises the animation
	//this el is for continuation of motion
	if(!vir.hasLoaded){
		vir.addEventListener('loaded',function(){
			activateVirus(vir);
		});		
	}
	else{
		vir.addEventListener('animationcomplete',function(e){
			let animComp = e.detail.name;
			let entity   = e.target;
			//console.log("DBG:",animComp, entity.id,entity.components[animComp].data.dur);
			if(animComp.includes("animation__f")){//reset direction, restart animation
				entity.components[animComp].data.to = -entity.components[animComp].data.to;
				entity.emit(entity.components[animComp].data.startEvents[0],false);
			}
		});	
		//this loop is for starting motion
		for (let [key, value] of Object.entries(vir.components)) {
			if(key.includes("animation__f")){
				vir.emit(value.data.startEvents[0],false);
			}
		};
	}
}

function spawnVirus(src,posRandom=false){
	//check if we have invisible ones
	let spawn;
	let srcPos = src.object3D.position;
	let isNew = true;
	if(whObj.invisible.length>0){//if an invisible one exists, repurpose
		spawn = whObj.invisible.shift();
		//make spawn visible
		spawn.children[0].components.material.material.opacity=1;
		spawn.setAttribute("position0",[srcPos.x,srcPos.y,wob(srcPos.z,3)].join(" "));
	}
	else{//create a new one
		spawn=virusFactory(src,src.parentEl,whObj.total);
		whObj.total++; //increment total
	}
	whObj.active.push(spawn);
	
	let pos0 = spawn.getAttribute("position0");
	if(posRandom){//wobble around src pos
		let tmp = pos0.split(" ");
		pos0 = [wob(Math.floor(tmp[0]),2),wob(Math.floor(tmp[1]),2),wob(Math.floor(tmp[2]),2)].join(" ");
		console.log("DBG:",tmp.join(" "),pos0);
	}
	spawn.setAttribute("position",pos0);
	updateAnimation(spawn,Math.random()>0.7?1:-1,Math.random()>0.7?1:-1);
	activateVirus(spawn);
}

function virusFactory(src,scene,id){//called when new one needs to be added
		let newPos = src.object3D.position;
		
		let newVParticle = document.createElement("a-entity");
		newVParticle.setAttribute("id","cov0"+id);
		//IMPORTANT: position0 is not same as position
		newVParticle.setAttribute("position0",[newPos.x,newPos.y,wob(newPos.z,3)].join(" "));
		newVParticle.setAttribute("mixin","fx fy");
		//let nextInstance =src.getElementsByClassName("cov")[0].cloneNode(false); //not a deep copy
		
		newVParticle.appendChild(buildVirus());
		scene.appendChild(newVParticle);
		return newVParticle;
}

function buildVirus(){//builds the AFrame version
	let cov = document.createElement("a-entity");
	cov.setAttribute("className","cov");
	cov.setAttribute("mixin","merge Rxyz washOutV");
	cov.setAttribute("material","opacity: 0.9; transparent: true");
	cov.setAttribute("scale","0.2 0.2 0.2");
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

