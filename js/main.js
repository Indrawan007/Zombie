// =============================================
//  MAIN.JS — Inisialisasi Phaser
// =============================================

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [BootScene, GameScene]
};

new Phaser.Game(config);
