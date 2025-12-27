// docs/menu.js
(function () {
  // Inserta el botón ☰ y el menú al principio del <body>
  const menuHTML = `
    <div class="menu-btn" id="menuBtn" aria-label="Abrir menú">☰</div>

    <nav id="menu" class="menu" aria-label="Menú principal">
      <a href="index.html">Inicio</a>
      <a href="clasificacion.html">Clasificación</a>
      <a href="campeones.html">Campeones</a>
      <a href="historia.html">Historia</a>
    </nav>
  `;

  document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML("afterbegin", menuHTML);

    const menu = document.getElementById("menu");
    const btn = document.getElementById("menuBtn");

    function toggleMenu() {
      menu.classList.toggle("active");
    }

    btn.addEventListener("click", toggleMenu);

    // Cierra el menú al hacer click fuera
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("active")) return;
      const clickedInside = menu.contains(e.target) || btn.contains(e.target);
      if (!clickedInside) menu.classList.remove("active");
    });
  });
})();
