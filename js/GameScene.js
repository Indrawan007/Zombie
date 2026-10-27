// =============================================
//  GAMESCENE.JS — Logika game utama
//  Terbagi per tanggung-jawab (method)
// =============================================

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    // ===================== CREATE =====================
    create() {
        // State
        this.hp = PLAYER_MAX_HP;
        this.hunger = 100;
        this.thirst = 100;
        this.energy = 100;
        this.kills = 0;
        this.day = 1;
        this.dayTimer = 0;
        this.alive = true;
        this.lastMelee = 0;
        this.inventory = new Array(6).fill(null);
        this.zombieHPBars = new Map();

        this.generateWorld();
        this.setupPlayer();
        this.setupCamera();
        this.setupDayNight();
        this.setupInput();
        this.setupHUD();

        // Zombie spawner
        this.zombies = this.physics.add.group();
        this.time.addEvent({ delay: SPAWN_INTERVAL, loop: true, callback: this.spawnZombie, callbackScope: this });
        for (let i = 0; i < 30; i++) this.spawnZombie();
    }

    // ===================== WORLD GEN =====================
    generateWorld() {
        this.worldLayer = this.add.group();

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * TILE + TILE / 2;
                const y = r * TILE + TILE / 2;
                const isRoadH = (r >= 48 && r <= 51);
                const isRoadV = (c >= 48 && c <= 51);
                const tex = (isRoadH || isRoadV) ? 'road' : 'grass';
                const tile = this.add.image(x, y, tex);
                tile.setDepth(0);
            }
        }

        // Bangunan acak
        for (let i = 0; i < 20; i++) {
            const bx = Phaser.Math.Between(5, COLS - 10) * TILE;
            const by = Phaser.Math.Between(5, ROWS - 10) * TILE;
            const bw = Phaser.Math.Between(3, 6);
            const bh = Phaser.Math.Between(3, 6);
            for (let r = 0; r < bh; r++) {
                for (let c = 0; c < bw; c++) {
                    const isEdge = r === 0 || r === bh - 1 || c === 0 || c === bw - 1;
                    const tex = isEdge ? 'wall' : 'floor';
                    const t = this.add.image(bx + c * TILE + TILE / 2, by + r * TILE + TILE / 2, tex);
                    t.setDepth(1);
                    if (isEdge) {
                        this.physics.add.existing(t, true);
                        t.body.setSize(TILE, TILE);
                    }
                }
            }
        }

        // Pohon
        for (let i = 0; i < 80; i++) {
            const tx = Phaser.Math.Between(1, COLS - 2) * TILE + TILE / 2;
            const ty = Phaser.Math.Between(1, ROWS - 2) * TILE + TILE / 2;
            const tree = this.add.image(tx, ty, 'tree').setDepth(2);
            this.physics.add.existing(tree, true);
        }

        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    }

    // ===================== PLAYER =====================
    setupPlayer() {
        this.player = this.physics.add.sprite(WORLD_W / 2, WORLD_H / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setCircle(12, 4, 4);

        // HP bar player
        this.playerHPBg = this.add.rectangle(0, 0, 40, 5, 0x333333).setDepth(20);
        this.playerHPBar = this.add.rectangle(0, 0, 40, 5, 0x2ecc71).setDepth(21);
    }

    // ===================== CAMERA =====================
    setupCamera() {
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    // ===================== DAY / NIGHT =====================
    setupDayNight() {
        this.nightOverlay = this.add.rectangle(
            WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x000022, 0
        ).setDepth(50).setScrollFactor(1);
        // Fix: overlay ikut kamera
        this.nightOverlay.setScrollFactor(0);
    }

    // ===================== INPUT =====================
    setupInput() {
        this.keys = this.input.keyboard.addKeys('W,A,S,D');
        this.input.on('pointerdown', (ptr) => {
            if (!this.alive) return;
            if (ptr.leftButtonDown()) this.handleMeleeAttack();
            if (ptr.rightButtonDown()) this.handleShoot();
        });
        this.input.keyboard.on('keydown', (e) => {
            if (!this.alive) { this.restartGame(); return; }
            const n = parseInt(e.key);
            if (n >= 1 && n <= 6) this.useItem(n - 1);
            if (e.key.toLowerCase() === 'f') this.pickupNearbyItems();
        });
    }

    // ===================== HUD =====================
    setupHUD() {
        const s = { fontSize: '14px', fontFamily: 'monospace', color: '#fff' };
        this.hudHP     = this.add.text(10, 10, '', s).setScrollFactor(0).setDepth(100);
        this.hudHunger = this.add.text(10, 30, '', s).setScrollFactor(0).setDepth(100);
        this.hudThirst = this.add.text(10, 50, '', s).setScrollFactor(0).setDepth(100);
        this.hudEnergy = this.add.text(10, 70, '', s).setScrollFactor(0).setDepth(100);
        this.hudTime   = this.add.text(10, 95, '', s).setScrollFactor(0).setDepth(100);
        this.hudKills  = this.add.text(10, 115, '', s).setScrollFactor(0).setDepth(100);

        // Hotbar
        this.hotbarSlots = [];
        for (let i = 0; i < 6; i++) {
            const bx = 10 + i * 44;
            const bg = this.add.rectangle(bx + 18, this.scale.height - 30, 40, 40, 0x222222, 0.7)
                .setScrollFactor(0).setDepth(100).setStrokeStyle(1, 0x888888);
            const lbl = this.add.text(bx + 4, this.scale.height - 48, `${i + 1}`, {
                fontSize: '10px', color: '#aaa', fontFamily: 'monospace'
            }).setScrollFactor(0).setDepth(101);
            const icon = this.add.text(bx + 6, this.scale.height - 36, '', {
                fontSize: '11px', color: '#fff', fontFamily: 'monospace'
            }).setScrollFactor(0).setDepth(101);
            this.hotbarSlots.push({ bg, lbl, icon });
        }
    }

    // ===================== ZOMBIE SPAWN =====================
    pickZombieType() {
        const roll = Phaser.Math.Between(1, 100);
        if (roll <= 40) return 'walker';
        if (roll <= 70) return 'runner';
        if (roll <= 90) return 'screamer';
        return 'tank';
    }

    spawnZombie() {
        if (!this.alive || this.zombies.countActive(true) >= MAX_ZOMBIES) return;

        const type = this.pickZombieType();
        const z = ZTYPES[type];
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(600, 1200);
        let x = this.player.x + Math.cos(angle) * dist;
        let y = this.player.y + Math.sin(angle) * dist;
        x = Phaser.Math.Clamp(x, 50, WORLD_W - 50);
        y = Phaser.Math.Clamp(y, 50, WORLD_H - 50);

        const zombie = this.physics.add.sprite(x, y, 'z_' + type).setDepth(8);
        zombie.zType = type;
        zombie.zHP = z.hp;
        zombie.zMaxHP = z.hp;
        zombie.zSpd = z.spd;
        zombie.zDmg = z.dmg;
        zombie.zDet = z.det;
        zombie.chasing = false;
        zombie.chaseTimer = 0;
        zombie.enraged = false;
        zombie.screamCD = 0;
        zombie.body.setCircle(10, 4, 4);
        this.zombies.add(zombie);

        // HP bar
        const barBg = this.add.rectangle(0, 0, 30, 4, 0x333333).setDepth(15);
        const barFg = this.add.rectangle(0, 0, 30, 4, 0xe74c3c).setDepth(16);
        this.zombieHPBars.set(zombie, { bg: barBg, fg: barFg });
    }

    // ===================== UPDATE LOOP =====================
    update(time, delta) {
        if (!this.alive) return;
        const dt = delta / 1000;

        this.updatePlayer(dt);
        this.updateZombies(dt);
        this.updateSurvival(dt);
        this.updateDayNightCycle(dt);
        this.updateHUD();
        this.updateHPBars();
    }

    // ===================== PLAYER MOVEMENT =====================
    updatePlayer(dt) {
        let vx = 0, vy = 0;
        if (this.keys.W.isDown) vy = -1;
        if (this.keys.S.isDown) vy = 1;
        if (this.keys.A.isDown) vx = -1;
        if (this.keys.D.isDown) vx = 1;

        const spd = this.energy <= 0 ? PLAYER_SPEED * 0.5 : PLAYER_SPEED;
        this.player.setVelocity(vx * spd, vy * spd);
        if (vx || vy) this.player.body.velocity.normalize().scale(spd);

        // Aim
        const ptr = this.input.activePointer;
        const worldPt = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
        this.player.rotation = Phaser.Math.Angle.Between(
            this.player.x, this.player.y, worldPt.x, worldPt.y
        );
    }

    // ===================== ZOMBIE AI =====================
    updateZombies(dt) {
        this.zombies.getChildren().forEach(z => {
            if (!z.active) return;
            const dist = Phaser.Math.Distance.Between(z.x, z.y, this.player.x, this.player.y);
            const zt = ZTYPES[z.zType];

            // Deteksi / chase
            if (dist < z.zDet || z.chasing) {
                z.chasing = true;
                z.chaseTimer += dt;

                // Runner enrage
                if (z.zType === 'runner' && z.chaseTimer > 3 && !z.enraged) {
                    z.enraged = true;
                    z.zSpd = zt.spd * 1.4;
                    z.setTint(0xff6666);
                }

                let spd = z.zSpd;
                this.physics.moveTo(z, this.player.x, this.player.y, spd);

                // Serang player
                if (dist < 28) {
                    z.setVelocity(0, 0);
                    if (!z._atkCD || z._atkCD <= 0) {
                        this.damagePlayer(z.zDmg);
                        z._atkCD = 1;
                    }
                }
                if (z._atkCD > 0) z._atkCD -= dt;

                // Screamer logic
                if (z.zType === 'screamer') {
                    z.screamCD -= dt;
                    if (z.screamCD <= 0 && dist < 350) {
                        this.triggerScreamerScream(z);
                        z.screamCD = 12;
                    }
                }
            } else {
                z.chasing = false;
                z.chaseTimer = 0;
                z.enraged = false;
                z.setVelocity(Phaser.Math.Between(-15, 15), Phaser.Math.Between(-15, 15));
            }
        });
    }

    // ===================== SCREAMER =====================
    triggerScreamerScream(z) {
        // Visual ring
        const ring = this.add.image(z.x, z.y, 'scream_ring').setDepth(40).setAlpha(1).setScale(1);
        this.tweens.add({
            targets: ring, scale: 16, alpha: 0, duration: 1200,
            onComplete: () => ring.destroy()
        });

        // Alert semua zombie dalam radius 500
        this.zombies.getChildren().forEach(oz => {
            if (!oz.active || oz === z) return;
            if (Phaser.Math.Distance.Between(z.x, z.y, oz.x, oz.y) < 500) {
                oz.chasing = true;
                oz.chaseTimer = 0;
            }
        });
    }

    // ===================== COMBAT =====================
    handleMeleeAttack() {
        const now = this.time.now;
        if (now - this.lastMelee < MELEE_CD) return;
        this.lastMelee = now;

        this.zombies.getChildren().forEach(z => {
            if (!z.active) return;
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, z.x, z.y) < MELEE_RANGE) {
                this.damageZombie(z, MELEE_DMG);
            }
        });
    }

    handleShoot() {
        const ptr = this.input.activePointer;
        const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, wp.x, wp.y);

        const b = this.physics.add.sprite(this.player.x, this.player.y, 'bullet').setDepth(12);
        b.body.setCircle(3);
        this.physics.velocityFromRotation(angle, BULLET_SPEED, b.body.velocity);
        this.time.delayedCall(2000, () => b.destroy());

        // Collision bullet → zombie
        this.physics.add.overlap(b, this.zombies, (bullet, z) => {
            this.damageZombie(z, BULLET_DMG);
            bullet.destroy();
        });
    }

    damageZombie(z, dmg) {
        z.zHP -= dmg;
        z.chasing = true;

        // Screamer scream saat dipukul
        if (z.zType === 'screamer' && z.screamCD <= 0) {
            this.triggerScreamerScream(z);
            z.screamCD = 12;
        }

        if (z.zHP <= 0) {
            this.kills++;
            this.dropLoot(z.x, z.y);
            const bars = this.zombieHPBars.get(z);
            if (bars) { bars.bg.destroy(); bars.fg.destroy(); this.zombieHPBars.delete(z); }
            z.destroy();
        }
    }

    damagePlayer(dmg) {
        this.hp -= dmg;
        this.cameras.main.shake(100, 0.01);
        if (this.hp <= 0) { this.hp = 0; this.showDeathScreen(); }
    }

    // ===================== LOOT =====================
    dropLoot(x, y) {
        if (Math.random() > 0.5) return;
        const key = Phaser.Utils.Array.GetRandom(ITEM_KEYS);
        const item = this.add.image(x, y, 'item_' + key).setDepth(5);
        item.itemKey = key;
        item.setInteractive();
        item.on('pointerdown', () => this._pickupItem(item));
    }

    pickupNearbyItems() {
        this.children.list.forEach(obj => {
            if (!obj.itemKey || !obj.active) return;
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y) < PICKUP_RANGE) {
                this._pickupItem(obj);
            }
        });
    }

    _pickupItem(item) {
        const slot = this.inventory.indexOf(null);
        if (slot === -1) return;
        this.inventory[slot] = item.itemKey;
        item.destroy();
    }

    useItem(slot) {
        const key = this.inventory[slot];
        if (!key) return;
        const def = ITEMS[key];
        if (def.heal)   this.hp     = Math.min(PLAYER_MAX_HP, this.hp + def.heal);
        if (def.hunger) this.hunger = Math.min(100, this.hunger + def.hunger);
        if (def.thirst) this.thirst = Math.min(100, this.thirst + def.thirst);
        if (def.energy) this.energy = Math.min(100, this.energy + def.energy);
        this.inventory[slot] = null;
    }

    // ===================== SURVIVAL =====================
    updateSurvival(dt) {
        this.hunger = Math.max(0, this.hunger - HUNGER_DRAIN * dt);
        this.thirst = Math.max(0, this.thirst - THIRST_DRAIN * dt);
        this.energy = Math.max(0, this.energy - ENERGY_DRAIN * dt);

        if (this.hunger <= 0) this.damagePlayer(STARVE_DMG * dt);
        if (this.thirst <= 0) this.damagePlayer(DEHYDRATE_DMG * dt);
    }

    // ===================== DAY/NIGHT CYCLE =====================
    updateDayNightCycle(dt) {
        this.dayTimer += dt;
        if (this.dayTimer >= DAY_LENGTH) { this.dayTimer -= DAY_LENGTH; this.day++; }

        const phase = this.dayTimer / DAY_LENGTH;
        let alpha = 0;
        if (phase > NIGHT_START)      alpha = (phase - NIGHT_START) / (1 - NIGHT_START) * 0.55;
        else if (phase < NIGHT_END)   alpha = (1 - phase / NIGHT_END) * 0.55;
        this.nightOverlay.setAlpha(alpha);
    }

    // ===================== HUD UPDATE =====================
    updateHUD() {
        const bar = (v, mx) => '█'.repeat(Math.round(v / mx * 15)) + '░'.repeat(15 - Math.round(v / mx * 15));
        this.hudHP.setText(`HP     ${bar(this.hp, PLAYER_MAX_HP)} ${Math.round(this.hp)}`);
        this.hudHunger.setText(`Hunger ${bar(this.hunger, 100)} ${Math.round(this.hunger)}`);
        this.hudThirst.setText(`Thirst ${bar(this.thirst, 100)} ${Math.round(this.thirst)}`);
        this.hudEnergy.setText(`Energy ${bar(this.energy, 100)} ${Math.round(this.energy)}`);

        const mins = Math.floor(this.dayTimer / 60);
        const secs = Math.floor(this.dayTimer % 60);
        this.hudTime.setText(`Day ${this.day}  ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        this.hudKills.setText(`Kills: ${this.kills}  Zombies: ${this.zombies.countActive(true)}`);

        // Hotbar
        this.hotbarSlots.forEach((s, i) => {
            const key = this.inventory[i];
            s.icon.setText(key ? ITEMS[key].lbl.substring(0, 5) : '');
        });
    }

    // ===================== HP BARS =====================
    updateHPBars() {
        // Player
        this.playerHPBg.setPosition(this.player.x, this.player.y - 24);
        this.playerHPBar.setPosition(this.player.x - 20 + (this.hp / PLAYER_MAX_HP) * 20, this.player.y - 24);
        this.playerHPBar.width = 40 * (this.hp / PLAYER_MAX_HP);

        // Zombies
        this.zombieHPBars.forEach((bars, z) => {
            if (!z.active) return;
            bars.bg.setPosition(z.x, z.y - 20);
            const pct = z.zHP / z.zMaxHP;
            bars.fg.setPosition(z.x - 15 + pct * 15, z.y - 20);
            bars.fg.width = 30 * pct;
        });
    }

    // ===================== DEATH =====================
    showDeathScreen() {
        this.alive = false;
        this.player.setVelocity(0, 0);
        this.physics.pause();

        const cx = this.cameras.main.scrollX + this.scale.width / 2;
        const cy = this.cameras.main.scrollY + this.scale.height / 2;
        const survSec = (this.day - 1) * DAY_LENGTH + this.dayTimer;
        const score = calcScore(survSec, this.kills, this.day);

        const overlay = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.75)
            .setScrollFactor(0).setDepth(200);

        const title = this.add.text(cx, cy - 80, "YOU'RE DEAD", {
            fontSize: '48px', fontFamily: 'monospace', color: '#e74c3c', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0);

        const stats = this.add.text(cx, cy, [
            `Survived: ${Math.floor(survSec)}s`,
            `Kills: ${this.kills}`,
            `Day: ${this.day}`,
            `Score: ${score}`
        ].join('\n'), {
            fontSize: '20px', fontFamily: 'monospace', color: '#fff', align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0);

        const hint = this.add.text(cx, cy + 100, '[ Press any key to retry ]', {
            fontSize: '16px', fontFamily: 'monospace', color: '#aaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0);

        this.tweens.add({ targets: title, alpha: 1, duration: 800 });
        this.tweens.add({ targets: stats, alpha: 1, duration: 800, delay: 400 });
        this.tweens.add({ targets: hint, alpha: 1, duration: 600, delay: 1000, yoyo: true, repeat: -1 });
    }

    restartGame() {
        this.scene.restart();
    }
}
