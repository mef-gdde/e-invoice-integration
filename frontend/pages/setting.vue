<script setup>
import axios from '~/lib/axios';

const company = ref({});
onMounted(async () => {
    const result = await axios.get('/auth')
    company.value = result.data
});
const config = useRuntimeConfig()
const disconnect = async () => {
    await axios.post('/auth/disconnect');
    company.value = '';
}

</script>
<template>
    <div class="overflow-x-scroll h-[100vh] pt-[40px] px-[20px]">
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-[20px]">Document</h5>
        <div class="bg-gray-100 p-5" v-if='company != ""'>
            <div  class="max-w-4xl mx-auto p-5 bg-white shadow-lg rounded-lg">
                <h1 class="text-xl font-bold text-gray-700">Company Profile</h1>
                <p class="text-md text-gray-600">Review the main information below:</p>
                <div class="mt-4">
                    <h2 class="font-semibold">Basic Information</h2>
                    <p><strong>Company Name (EN):</strong> {{ company.company_name_en }}</p>
                    <p><strong>Company Name (KH):</strong> {{ company.company_name_kh }}</p>
                    <p><strong>TIN:</strong> {{ company.tin }}</p>
                 
                </div>
                <div class="mt-4">
                    <h2 class="font-semibold">Contact Information</h2>
                    <p><strong>City:</strong> {{ company.city }}</p>
                    <p><strong>Country:</strong> {{ company.country }}</p>
                    <p><strong>Phone:</strong> {{ company.phone_number }}</p>
                    <p><strong>Email:</strong> {{ company.email }}</p>
                </div>
               
                
                <button @click="disconnect()" type="button" class="focus:outline-none text-white mt-5 bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Disconnect</button>

            </div>
            
        </div>
        <a v-if='company == ""' :href="config.public.connectUrl" type="button"
            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
            Connect to caminv
        </a>
        </div>

</template>
