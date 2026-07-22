/* ScaleDesk shared behavior: nav, reveals, matcher, tabs */
(function(){
  // nav scroll state
  var nav=document.querySelector('.nav');
  function onScroll(){ nav && nav.classList.toggle('scrolled', window.scrollY>16); }
  document.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // mobile menu
  var burger=document.querySelector('.nav-burger'), mob=document.querySelector('.nav-mobile');
  if(burger&&mob){ burger.addEventListener('click',function(){ mob.classList.toggle('open'); }); }

  // ---- motion system (GSAP), degrades to static when reduced-motion or hidden tab ----
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.visibilityState==='hidden';

  // split hero h1 into masked words
  document.querySelectorAll('.rv-words').forEach(function(h){
    if(reduce||!window.gsap) return;
    if(h.hasAttribute('data-i18n')||h.querySelector('[data-i18n]')){ return; } // translatable: innerHTML gets swapped, skip split
    h.querySelectorAll(':scope > *, :scope').forEach(function(){});
    var walk=function(node){
      [].slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType===3 && n.textContent.trim()){
          var frag=document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(t){
            if(!t.trim()){ frag.appendChild(document.createTextNode(t)); return; }
            var w=document.createElement('span'); w.className='w';
            var i=document.createElement('i'); i.textContent=t;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag,n);
        } else if(n.nodeType===1 && !n.classList.contains('w')) walk(n);
      });
    };
    walk(h);
  });

  function showAll(){
    document.querySelectorAll('.rv').forEach(function(el){ el.style.opacity=1; el.style.transform='none'; });
    document.querySelectorAll('.w>i').forEach(function(i){ i.style.transform='none'; });
    document.querySelectorAll('.uline').forEach(function(u){ u.classList.add('in'); });
    document.querySelectorAll('[data-count]').forEach(function(c){ c.textContent=c.dataset.count+(c.dataset.suffix||''); });
  }

  if(!reduce && window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);

    // hero word cascade
    document.querySelectorAll('.rv-words').forEach(function(h){
      gsap.to(h.querySelectorAll('.w>i'),{y:0,duration:.9,ease:'power4.out',stagger:.07,delay:.1});
    });

    // reveals
    document.querySelectorAll('.rv').forEach(function(el){
      gsap.to(el,{opacity:1,y:0,duration:.85,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 88%',once:true},
        delay:(el.dataset.d? +el.dataset.d : 0)});
    });

    // gradient underlines draw in (backend motif)
    document.querySelectorAll('.uline').forEach(function(u){
      ScrollTrigger.create({trigger:u,start:'top 86%',once:true,onEnter:function(){u.classList.add('in')}});
    });

    // count-up stats
    document.querySelectorAll('[data-count]').forEach(function(c){
      var target=parseFloat(c.dataset.count), suf=c.dataset.suffix||'';
      var obj={v:0};
      ScrollTrigger.create({trigger:c,start:'top 90%',once:true,onEnter:function(){
        gsap.to(obj,{v:target,duration:1.4,ease:'power2.out',onUpdate:function(){
          c.textContent=Math.round(obj.v)+suf;
        }});
      }});
    });

    // aura blobs: slow drift
    document.querySelectorAll('.blob').forEach(function(b,i){
      gsap.to(b,{x:(i%2?-40:50),y:(i%2?50:-36),scale:1.12,duration:7+i*2,ease:'sine.inOut',yoyo:true,repeat:-1});
    });

    // hero beam parallax
    document.querySelectorAll('.hero-beam').forEach(function(bm){
      gsap.to(bm,{yPercent:18,ease:'none',scrollTrigger:{trigger:bm.parentElement,start:'top top',end:'bottom top',scrub:true}});
    });

    // parallax photos
    document.querySelectorAll('.split .ph img').forEach(function(img){
      gsap.fromTo(img,{yPercent:-7},{yPercent:7,ease:'none',
        scrollTrigger:{trigger:img.closest('.ph'),start:'top bottom',end:'bottom top',scrub:true}});
    });

    // statement: ghost word drifts, beam sweeps
    document.querySelectorAll('.statement').forEach(function(s){
      var g=s.querySelector('.ghost');
      if(g) gsap.fromTo(g,{xPercent:6},{xPercent:-6,ease:'none',
        scrollTrigger:{trigger:s,start:'top bottom',end:'bottom top',scrub:true}});
      var beams=s.querySelectorAll('.s-beam');
      if(beams.length) gsap.from(beams,{xPercent:60,opacity:0,duration:1.2,ease:'power3.out',stagger:.15,
        scrollTrigger:{trigger:s,start:'top 75%',once:true}});
    });

    // safety: if tab gets hidden mid-tween leaving things stuck, force-complete on hide
    document.addEventListener('visibilitychange',function(){
      if(document.visibilityState==='hidden') return;
      ScrollTrigger.refresh();
    });
  } else {
    showAll();
  }

  // tabs (generic)
  document.querySelectorAll('[data-tabs]').forEach(function(root){
    var tabs=root.querySelectorAll('.tab'), panels=root.querySelectorAll('.tabpanel');
    tabs.forEach(function(t,i){ t.addEventListener('click',function(){
      tabs.forEach(function(x){x.classList.remove('on')}); t.classList.add('on');
      panels.forEach(function(p,j){ p.hidden = j!==i; });
    });});
  });

  // ---- matcher (hero widget) ----
  var m=document.getElementById('matcher'); if(!m) return;
  var WIZ='https://scaledesk-ops.lovable.app/get-matched';
  var state={need:[],hours:'',industry:''}, step=0;
  var panels=[].slice.call(m.querySelectorAll('.mpanel'));
  var bars=[].slice.call(m.querySelectorAll('.mbars i'));
  var next=m.querySelector('.mnext'), back=m.querySelector('.mback'),
      mnav=m.querySelector('.mnav'), lab=m.querySelector('.mstep');
  function show(i){
    panels.forEach(function(p,x){ p.hidden = x!==i; });
    bars.forEach(function(b,x){ b.classList.toggle('on', x<=i && i<3); });
    lab.textContent = i<3 ? 'Step '+(i+1)+' / 3' : 'Done';
    back.classList.toggle('hide', i===0);
    mnav.style.display = i===3 ? 'none' : 'flex';
    validate();
  }
  function validate(){
    var ok = step===0 ? state.need.length>0 : step===1 ? !!state.hours : step===2 ? !!state.industry : true;
    next.textContent = step===2 ? 'See my match' : 'Next';
    next.classList.toggle('ok', !!ok);
  }
  m.querySelectorAll('[data-group]').forEach(function(g){
    var key=g.dataset.group, multi=g.dataset.multi;
    g.querySelectorAll('.chip').forEach(function(btn){ btn.addEventListener('click',function(){
      if(multi){ btn.classList.toggle('on');
        state.need=[].slice.call(g.querySelectorAll('.on')).map(function(b){return b.dataset.val});
      } else {
        g.querySelectorAll('.chip').forEach(function(b){b.classList.remove('on')});
        btn.classList.add('on'); state[key]=btn.dataset.val;
      }
      validate();
    });});
  });
  next.addEventListener('click',function(){ if(step<2){step++;show(step);} else {done();} });
  back.addEventListener('click',function(){ if(step>0){step--;show(step);} });
  m.querySelector('.mreset').addEventListener('click',function(){
    state={need:[],hours:'',industry:''}; step=0;
    m.querySelectorAll('.chip.on').forEach(function(c){c.classList.remove('on')});
    show(0);
  });
  function done(){
    step=3; show(3);
    var plan = state.hours.indexOf('40')>-1 ? 'Full-Time' : 'Part-Time';
    m.querySelector('.msum').textContent =
      "We'll match you with a vetted assistant for "+state.industry.toLowerCase()+', trained on '+
      (state.need.length? state.need.join(', ').toLowerCase() : 'your day-to-day')+'.';
    m.querySelector('.plan').textContent = 'Best fit: '+plan+' plan';
    var q = '?need='+encodeURIComponent(state.need.join(','))+
            '&hours='+encodeURIComponent(state.hours)+
            '&industry='+encodeURIComponent(state.industry)+
            '&plan='+encodeURIComponent(plan)+'&src=site-matcher';
    m.querySelector('.mgo').setAttribute('href', WIZ+q);
  }
  show(0);
})();
