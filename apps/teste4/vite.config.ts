import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // Força o Vite a resolver APENAS UMA instância do core e do math no bundle
    dedupe: ['@framekore/core', '@framekore/math'],
  },
});