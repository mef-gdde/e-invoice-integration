<template>
    <div>Authorizing</div>
  </template>
  
  <script lang="ts" setup>
import axios from '~/lib/axios';
import { onMounted } from 'vue';

  
  const route = useRoute();
  
  const authToken = route.query.authToken as string;
  if (! authToken) {
    throw createError({
      statusCode: 401,
      message: 'Service is unavailable!',
    });
  }
  onMounted(async () => {
    const result = await axios.post('/auth/authorize',  {
        auth_token: authToken
    })

    navigateTo('/setting')
  })
  </script>
  