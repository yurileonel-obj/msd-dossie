/* Comportamento da página: expandir/recolher a árvore, abrir tudo para impressão
   e o tooltip do gráfico. */
(function () {
  var nodes = Array.prototype.slice.call(document.querySelectorAll('details.node'));
  var ea = document.getElementById('expandAll');
  var ca = document.getElementById('collapseAll');
  if (ea) ea.addEventListener('click', function () { nodes.forEach(function (n) { n.open = true; }); });
  if (ca) ca.addEventListener('click', function () { nodes.forEach(function (n) { n.open = false; }); });

  /* Impressão: os ramos fechados precisam sair abertos no papel, senão o PDF
     mostra o título do ramo e nenhum conteúdo.

     Isso não dá para resolver só em CSS: desde o Chrome 128 o conteúdo de um
     <details> fechado vive no pseudo-elemento ::details-content com
     content-visibility: hidden, que `display: block` nos filhos não sobrescreve.
     print.css tenta o caminho CSS para navegadores que o suportam; aqui está a
     garantia, que funciona em qualquer versão.

     Dois gatilhos:
       ?print=1  → o export-pdf.mjs usa este, porque o --print-to-pdf headless
                   não dispara beforeprint de forma confiável;
       beforeprint → cobre o Ctrl+P de quem abriu a versão publicada. */
  var saved = false;

  function openForPrint() {
    if (!saved) {
      nodes.forEach(function (n) { n.dataset.wasOpen = n.open ? '1' : '0'; });
      saved = true;
    }
    nodes.forEach(function (n) { n.open = true; });
  }

  function restoreAfterPrint() {
    if (!saved) return;
    nodes.forEach(function (n) { n.open = n.dataset.wasOpen === '1'; });
    saved = false;
  }

  if (/(^|[?&])print(=|&|$)/.test(location.search)) openForPrint();
  window.addEventListener('beforeprint', openForPrint);
  window.addEventListener('afterprint', restoreAfterPrint);

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
