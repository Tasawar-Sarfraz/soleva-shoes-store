/* Original SOLEVA scene. A-Frame is loaded only in this on-demand document. */
(function(){
  var scene,camera;
  var canvas=document.createElement('canvas');
  var context=canvas.getContext('webgl2')||canvas.getContext('webgl');
  if(!context||!window.AFRAME){document.getElementById('fallback').hidden=false;document.getElementById('status').textContent='2D FALLBACK / WEBGL UNAVAILABLE';return;}
  context.getExtension('WEBGL_lose_context')?.loseContext();
  function entity(tag,attrs,parent){var el=document.createElement(tag);Object.keys(attrs).forEach(function(key){el.setAttribute(key,attrs[key]);});parent.appendChild(el);return el;}
  scene=entity('a-scene',{'embedded':'','vr-mode-ui':'enabled: false','xr-mode-ui':'enabled: false','renderer':'antialias: false; colorManagement: true','background':'color: #e9e8dc'},document.body);
  scene.style.cssText='height:100%;width:100%;position:absolute;inset:0';
  entity('a-plane',{rotation:'-90 0 0',width:20,height:20,color:'#d8d9cb'},scene);
  entity('a-box',{position:'0 2 -5',width:12,height:5,depth:.15,color:'#ecebdf'},scene);
  entity('a-box',{position:'-6 2 0',width:.15,height:5,depth:10,color:'#e2e4d6'},scene);
  entity('a-box',{position:'6 2 0',width:.15,height:5,depth:10,color:'#e2e4d6'},scene);
  entity('a-light',{type:'ambient',intensity:.8},scene);
  entity('a-light',{type:'directional',position:'2 4 3',intensity:1},scene);
  camera=entity('a-entity',{position:'0 1.6 3',camera:'','look-controls':'touchEnabled: true; mouseEnabled: true','wasd-controls':'acceleration: 10'},scene);
  entity('a-entity',{cursor:'rayOrigin: mouse',raycaster:'objects: .selectable'},scene);
  [{name:'Arc',x:-2.8,color:'#e6e8d9',slug:'arc-01-sneakers'},{name:'Pace',x:0,color:'#c5d2c9',slug:'pace-01-running'},{name:'Ledger',x:2.8,color:'#664839',slug:'ledger-01-formal'}].forEach(function(product){
    entity('a-cylinder',{position:product.x+' .5 -1.7',height:1,radius:.85,color:'#c6cbb8'},scene);
    var group=entity('a-entity',{position:product.x+' 1.18 -1.7',rotation:'0 -25 0',class:'selectable'},scene);
    entity('a-box',{width:1.25,height:.16,depth:.53,color:'#eceddc',position:'0 0 0'},group);
    entity('a-sphere',{radius:.52,scale:'1.25 .44 .5',position:'.05 .2 0',color:product.color},group);
    entity('a-box',{width:.4,height:.33,depth:.45,position:'-.38 .26 0',color:product.color},group);
    for(var i=0;i<4;i++)entity('a-cylinder',{radius:.015,height:.36,rotation:'90 0 0',position:(-.25+i*.1)+' .43 0',color:'#f5f3e7'},group);
    group.addEventListener('click',function(){document.getElementById('status').textContent=product.name.toUpperCase()+' DISPLAY SELECTED — OPEN ITS PRODUCT LINK OUTSIDE THE VIEWER';});
  });
  var views={arc:{x:-2.8,z:1.1},pace:{x:0,z:1.1},ledger:{x:2.8,z:1.1}};
  document.querySelectorAll('[data-view]').forEach(function(button){button.addEventListener('click',function(){var target=views[button.dataset.view];camera.setAttribute('position',target.x+' 1.6 '+target.z);camera.setAttribute('rotation','0 0 0');document.getElementById('status').textContent=button.textContent.toUpperCase()+' / USE THE HTML PRODUCT LINKS';});});
  function rotate(amount){var control=camera.components['look-controls'];if(control)control.yawObject.rotation.y+=amount;}
  document.getElementById('left').onclick=function(){rotate(.2);};document.getElementById('right').onclick=function(){rotate(-.2);};
  window.addEventListener('message',async function(event){if(event.origin!==location.origin)return;if(event.data?.type==='soleva-reset'){camera.setAttribute('position','0 1.6 3');var control=camera.components['look-controls'];if(control){control.yawObject.rotation.y=0;control.pitchObject.rotation.x=0;}}if(event.data?.type==='soleva-enter-xr'){try{if(!navigator.xr||!await navigator.xr.isSessionSupported('immersive-vr'))throw Error('Unsupported');await scene.enterVR();}catch{document.getElementById('status').textContent='IMMERSIVE MODE UNAVAILABLE — MOUSE, TOUCH AND KEYBOARD CONTROLS ARE READY';}}});
  document.addEventListener('visibilitychange',function(){if(document.hidden)scene.pause();else scene.play();});
  scene.addEventListener('renderstart',function(){scene.renderer.setPixelRatio(1);scene.canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();scene.pause();document.getElementById('fallback').hidden=false;document.getElementById('status').textContent='WEBGL CONTEXT LOST / USE THE HTML PRODUCT LINKS';});});
  window.addEventListener('pagehide',function(){scene.pause();scene.object3D?.traverse(function(object){object.geometry?.dispose();var materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(function(material){material?.dispose();});});scene.renderer?.dispose();});
})();
