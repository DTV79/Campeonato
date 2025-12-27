// docs/menu.js
(function () {

  const menuHTML = `
  <!-- TOP BAR -->
  <header class="topbar simple">
      <div class="hamburger left" id="hamburger">☰</div>
  </header>

  <!-- MENÚ LATERAL -->
  <nav id="drawer" class="drawer new-menu">
      <div class="drawer-section">
          <a href="index.html"><span>🏠</span> Inicio</a>
          <a href="historia.html"><span>📖</span> Historia</a>
          <a href="clasificacion.html"><span>📊</span> Clasificación</a>
          <a href="partidos.html"><span>🎾</span> Partidos</a>
      </div>

      <div class="drawer-section">
          <a href="normas.html"><span>📜</span> Normas</a>
          <a href="campeones.html"><span>🏆</span> Campeones</a>
          <a href="fotos.html"><span>📸</span> Fotos</a>
      </div>
  </nav>

  <div id="drawer-overlay" class="drawer-overlay"></div>
  `;

  function toggleMenu() {
      document.getElementById("drawer").classList.toggle("open");
      document.getElementById("drawer-overlay").classList.toggle("visible");
  }

  document.addEventListener("DOMContentLoaded", () => {
      document.body.insertAdjacentHTML("afterbegin", menuHTML);

      document.getElementById("hamburger").addEventListener("click", toggleMenu);
      document.getElementById("drawer-overlay").addEventListener("click", toggleMenu);
  });

})();


