// =============================================
//  BOOTSCENE.JS — Generate semua tekstur prosedural
// =============================================

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        this._makePlayer();
        this._makeZombies();
        this._makeTiles();
        this._makeItems();
        this._makeEffects();
        this.scene.start('GameScene');
    }

    /* ---------- helpers ---------- */
    _gfx(w, h) {
        return this.make.graphics({ x: 0, y: 0, add: false });
    }

    _circle(g, r, color, x, y) {
        g.fillStyle(color, 1);
        g.fillCircle(x || r, y || r, r);
    }

    _rect(g, x, y, w, h, color) {
        g.fillStyle(color, 1);
        g.fillRect(x, y, w, h);
    }

    /* ---------- textures ---------- */
    _makePlayer() {
        const g = this._gfx(32, 32);
        this._circle(g, 14, 0x3498db, 16, 16);
        this._circle(g, 6, 0xf5cba7, 16, 8);
        g.generateTexture('player', 32, 32);
        g.destroy();
    }

    _makeZombies() {
        for (const [key, z] of Object.entries(ZTYPES)) {
            const size = key === 'tank' ? 40 : 28;
            const g = this._gfx(size, size);
            const r = size / 2;
            this._circle(g, r - 2, z.col, r, r);
            this._circle(g, r * 0.4, 0x222222, r, r * 0.6);
            g.generateTexture('z_' + key, size, size);
            g.destroy();
        }
    }

    _makeTiles() {
        // Grass
        let g = this._gfx(TILE, TILE);
        this._rect(g, 0, 0, TILE, TILE, 0x3d7a2a);
        g.generateTexture('grass', TILE, TILE);
        g.destroy();

        // Road
        g = this._gfx(TILE, TILE);
        this._rect(g, 0, 0, TILE, TILE, 0x555555);
        g.generateTexture('road', TILE, TILE);
        g.destroy();

        // Wall
        g = this._gfx(TILE, TILE);
        this._rect(g, 0, 0, TILE, TILE, 0x8B7355);
        g.generateTexture('wall', TILE, TILE);
        g.destroy();

        // Floor
        g = this._gfx(TILE, TILE);
        this._rect(g, 0, 0, TILE, TILE, 0x9e8c6c);
        g.generateTexture('floor', TILE, TILE);
        g.destroy();

        // Tree
        g = this._gfx(TILE, TILE);
        this._rect(g, 26, 30, 12, 20, 0x5c3a1e);
        this._circle(g, 18, 0x2d6e1e, 32, 22);
        g.generateTexture('tree', TILE, TILE);
        g.destroy();
    }

    _makeItems() {
        for (const [key, it] of Object.entries(ITEMS)) {
            const g = this._gfx(16, 16);
            this._rect(g, 2, 2, 12, 12, it.col);
            g.generateTexture('item_' + key, 16, 16);
            g.destroy();
        }
    }

    _makeEffects() {
        // Scream ring
        const g = this._gfx(64, 64);
        g.lineStyle(3, 0x9b59b6, 0.7);
        g.strokeCircle(32, 32, 28);
        g.generateTexture('scream_ring', 64, 64);
        g.destroy();

        // Bullet
        const g2 = this._gfx(8, 8);
        this._circle(g2, 3, 0xffff00, 4, 4);
        g2.generateTexture('bullet', 8, 8);
        g2.destroy();
    }
}
