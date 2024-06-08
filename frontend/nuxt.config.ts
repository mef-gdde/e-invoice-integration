// https://nuxt.com/docs/api/configuration/nuxt-config
const clientId = 'a0585135d8837fd67c5e8362d6766f31'
const redirectUrl = 'http://localhost:3000/authorize'
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  runtimeConfig: {
    public: {
      connectUrl: `http://sb-merchant.e-invoice.gov.kh/connect?client_id=${clientId}&redirect_url=${redirectUrl}`
    }
  },
  devServer: {
    port: 4000
  },
  ssr: false,
  devtools: { enabled: true }
})
