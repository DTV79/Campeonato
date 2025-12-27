// docs/menu.js
(function () {
  const topbarHTML = `
    <div class="topbar">
      <div class="hamburger" id="hamburger">☰</div>
    </div>

    <div class="drawer-overlay" id="drawerOverlay"></div>

    <nav class="drawer" id="drawer">
      <div class="drawer-header">
        <div class="drawer-close" id="drawerClose">✕</div>
        <div class="drawer-avatar">🎾</div>
        <div class="drawer-username">Campeonato Pádel</div>
        <div class="drawer-sub">Menú</div>
      </div>

      <div class="drawer-section">
        <a href="index.html">Inicio</a>
        <a href="clasificacion.html">Clasificación</a>
        <a href="partidos.html">Partidos</a>
        <a href="campeones.html">Campeones</a>
        <a href="historia.html">Historia</a>
      </div>
    </nav>
  `;

  function openDrawer() {
    document.getElementById("drawer").classList.add("open");
    document.getElementById("drawerOverlay").classList.add("visible");
  }

  function closeDrawer() {
    document.getElementById("drawer").classList.remove("open");
    document.getElementById("drawerOverlay").classList.remove("visible");
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Inserta el menú al principio del body
    document.body.insertAdjacentHTML("afterbegin", topbarHTML);

    // Eventos
    document.getElementById("hamburger").addEventListener("click", openDrawer);
    document.getElementById("drawerClose").addEventListener("click", closeDrawer);
    document.getElementById("drawerOverlay").addEventListener("click", closeDrawer);
  });
})();

