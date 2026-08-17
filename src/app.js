/* Comportamento da página: expandir/recolher a árvore e o tooltip do gráfico. */
(function () {
  var nodes = Array.prototype.slice.call(document.querySelectorAll('details.node'));
  var ea = document.getElementById('expandAll');
  var ca = document.getElementById('collapseAll');
  if (ea) ea.addEventListener('click', function () { nodes.forEach(function (n) { n.open = true; }); });
  if (ca) ca.addEventListener('click', function () { nodes.forEach(function (n) { n.open = false; }); });

  var tip = document.getElementById('tip');
  var bar = document.getElementById('bar');
  if (bar && tip) {
    bar.addEventListener('mousemove', function (e) {
      var seg = e.target.closest('.seg');
      if (!seg) { tip.style.opacity = 0; return; }
      tip.innerHTML = seg.dataset.n + ' <span class="pct">' + seg.dataset.p + '</span>';
      tip.style.opacity = 1;
      var x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 12);
      tip.style.left = x + 'px';
      tip.style.top = (e.clientY - tip.offsetHeight - 12) + 'px';
    });
    bar.addEventListener('mouseleave', function () { tip.style.opacity = 0; });
  }
})();
