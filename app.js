document.addEventListener('DOMContentLoaded', () => {
    const categoriesContainer = document.getElementById('categoriesContainer');
    const productsContainer = document.getElementById('productsContainer');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const currentCategoryDesc = document.getElementById('currentCategoryDesc');
    const searchInput = document.getElementById('searchInput');
    const productModal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeModal');

    // Categoría inicial predeterminada
    let currentCategoryId = CONFIG_MENU.categorias[0].id;

    // Renderizar botones de navegación por categorías
    function renderCategories() {
        if (!CONFIG_MENU || !CONFIG_MENU.categorias) return;
        
        categoriesContainer.innerHTML = CONFIG_MENU.categorias.map(cat => `
            <button class="nav-btn ${cat.id === currentCategoryId ? 'active' : ''}" data-id="${cat.id}">
                ${cat.nombre}
            </button>
        `).join('');

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentCategoryId = e.target.getAttribute('data-id');
                if (searchInput) searchInput.value = ''; // Limpia el buscador al cambiar de pestaña
                renderCategories();
                renderProducts();
            });
        });
    }

    // Renderizar rejilla de productos
    function renderProducts(filterQuery = '') {
        if (!CONFIG_MENU || !CONFIG_MENU.productos) return;

        const category = CONFIG_MENU.categorias.find(c => c.id === currentCategoryId);
        if (category && filterQuery.trim() === '') {
            currentCategoryTitle.textContent = category.nombre;
            currentCategoryDesc.textContent = category.descripcion || '';
        }

        let filteredProducts = CONFIG_MENU.productos.filter(p => p.activo !== false);

        if (filterQuery.trim() !== '') {
            const query = filterQuery.toLowerCase();
            filteredProducts = filteredProducts.filter(p => 
                p.nombre.toLowerCase().includes(query) ||
                (p.cepa && p.cepa.toLowerCase().includes(query)) ||
                (p.pais && p.pais.toLowerCase().includes(query)) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(query))
            );
            currentCategoryTitle.textContent = `Resultados (${filteredProducts.length})`;
            currentCategoryDesc.textContent = `Buscando: "${filterQuery}"`;
        } else {
            filteredProducts = filteredProducts.filter(p => p.categoria === currentCategoryId);
        }

        if (filteredProducts.length === 0) {
            productsContainer.innerHTML = `<div style="text-align:center; padding: 40px; color: #888;">No se encontraron opciones disponibles.</div>`;
            return;
        }

        productsContainer.innerHTML = filteredProducts.map(p => {
            let badgeHtml = '';
            if (p.destacado) {
                badgeHtml = `<span class="badge badge-star">${p.destacado}</span>`;
            } else if (p.organico) {
                badgeHtml = `<span class="badge badge-organic">🌱 Orgánico / 0.0%</span>`;
            }

            let pricesHtml = '';
            if (p.precioCopa && p.precioBotella) {
                pricesHtml = `
                    <span class="price-tag">Q${p.precioCopa} <span class="price-label">copa</span></span>
                    <span class="price-tag" style="font-size: 0.9rem; color: #666;">Q${p.precioBotella} <span class="price-label">botella</span></span>
                `;
            } else if (p.precioBotella) {
                pricesHtml = `<span class="price-tag">Q${p.precioBotella} <span class="price-label">botella</span></span>`;
            } else if (p.precioCopa) {
                pricesHtml = `<span class="price-tag">Q${p.precioCopa} <span class="price-label">copa</span></span>`;
            } else if (p.precio) {
                pricesHtml = `<span class="price-tag">Q${p.precio}</span>`;
            }

            let subInfo = [];
            if (p.cepa) subInfo.push(p.cepa);
            if (p.pais) subInfo.push(p.pais);

            return `
                <div class="product-card" data-id="${p.id}">
                    <div class="product-info">
                        ${badgeHtml}
                        <h3 class="product-title">${p.nombre}</h3>
                        <p class="product-sub">${subInfo.join(' · ')}</p>
                    </div>
                    <div class="product-prices">${pricesHtml}</div>
                </div>
            `;
        }).join('');

        // Listener para abrir el modal al tocar una tarjeta
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                openModal(id);
            });
        });
    }

    // Desplegar modal detallado del producto
    function openModal(productId) {
        const p = CONFIG_MENU.productos.find(prod => prod.id === productId);
        if (!p) return;

        let pairingHtml = p.maridaje ? `<div class="modal-pairing">🧀 <strong>Sugerencia de Maridaje:</strong> ${p.maridaje}</div>` : '';

        let priceText = '';
        if (p.precioCopa && p.precioBotella) {
            priceText = `Copa: Q${p.precioCopa} | Botella: Q${p.precioBotella}`;
        } else if (p.precioBotella) {
            priceText = `Botella: Q${p.precioBotella}`;
        } else if (p.precioCopa) {
            priceText = `Copa: Q${p.precioCopa}`;
        } else if (p.precio) {
            priceText = `Precio: Q${p.precio}`;
        }

        modalBody.innerHTML = `
            <h3 class="modal-title">${p.nombre}</h3>
            <p style="color: #888; font-size: 0.85rem; margin-bottom: 8px;">${p.cepa ? p.cepa + ' · ' : ''}${p.pais ? 'Origen: ' + p.pais : ''}</p>
            <p class="modal-desc">${p.descripcion || 'Selección especial para disfrutar en Viñamor Paseo Cayalá.'}</p>
            ${pairingHtml}
            <div style="margin-top: 20px; text-align: right;">
                <span style="font-size: 1.15rem; font-weight: 700; color: #2C1820;">
                    ${priceText}
                </span>
            </div>
        `;
        productModal.classList.add('active');
    }

    // Eventos de cierre de modal
    closeModal.addEventListener('click', () => productModal.classList.remove('active'));
    productModal.addEventListener('click', (e) => { 
        if (e.target === productModal) productModal.classList.remove('active'); 
    });

    // Evento del buscador en tiempo real
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderProducts(e.target.value));
    }

    // Inicializar la aplicación
    renderCategories();
    renderProducts();
});
