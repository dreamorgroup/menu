document.addEventListener('DOMContentLoaded', () => {
    const categoriesContainer = document.getElementById('categoriesContainer');
    const productsContainer = document.getElementById('productsContainer');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const currentCategoryDesc = document.getElementById('currentCategoryDesc');
    const searchInput = document.getElementById('searchInput');
    const productModal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeModal');

    // SVG de botella elegante para cuando la imagen aún no está cargada en el servidor
    const defaultBottleSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23C5A059" width="32" height="48"><path d="M11 2h2v4.17l1.71 1.71A3 3 0 0 1 15.58 10H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h.42a3 3 0 0 1 1.87-2.12L11 6.17V2z"/></svg>`;

    let currentCategoryId = CONFIG_MENU.categorias[0].id;

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
                if (searchInput) searchInput.value = '';
                renderCategories();
                renderProducts();
            });
        });
    }

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

        // 🌟 ORDEN ASCENDENTE AUTOMÁTICO POR PRECIO (DE MENOR A MAYOR)
        filteredProducts.sort((a, b) => {
            const priceA = a.precioCopa || a.precioBotella || a.precio || 0;
            const priceB = b.precioCopa || b.precioBotella || b.precio || 0;
            return priceA - priceB;
        });

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
                    <span class="price-tag" style="font-size: 0.85rem; color: #666;">Q${p.precioBotella} <span class="price-label">botella</span></span>
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

            const imgPath = p.imagen || `img/botellas/${p.id}.png`;

            return `
                <div class="product-card" data-id="${p.id}">
                    <div class="product-thumb">
                        <img src="${imgPath}" alt="${p.nombre}" onerror="this.onerror=null; this.src='${defaultBottleSVG}';">
                    </div>
                    <div class="product-info">
                        ${badgeHtml}
                        <h3 class="product-title">${p.nombre}</h3>
                        <p class="product-sub">${subInfo.join(' · ')}</p>
                    </div>
                    <div class="product-prices">${pricesHtml}</div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                openModal(id);
            });
        });
    }

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

        const imgPath = p.imagen || `img/botellas/${p.id}.png`;

        modalBody.innerHTML = `
            <div class="modal-img-container">
                <img src="${imgPath}" alt="${p.nombre}" onerror="this.onerror=null; this.src='${defaultBottleSVG}';">
            </div>
            <h3 class="modal-title">${p.nombre}</h3>
            <p style="color: #888; font-size: 0.85rem; margin-bottom: 8px;">${p.cepa ? p.cepa + ' · ' : ''}${p.pais ? 'Origen: ' + p.pais : ''}</p>
            <p class="modal-desc">${p.descripcion || 'Selección especial para disfrutar en la terraza de Paseo Cayalá.'}</p>
            ${pairingHtml}
            <div style="margin-top: 20px; text-align: right;">
                <span style="font-size: 1.15rem; font-weight: 700; color: #4A121A;">
                    ${priceText}
                </span>
            </div>
        `;
        productModal.classList.add('active');
    }

    closeModal.addEventListener('click', () => productModal.classList.remove('active'));
    productModal.addEventListener('click', (e) => { 
        if (e.target === productModal) productModal.classList.remove('active'); 
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderProducts(e.target.value));
    }

    renderCategories();
    renderProducts();
});
