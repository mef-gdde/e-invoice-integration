<script setup lang="ts">
import axios from '~/lib/axios';
import type { Document } from '~/types/Model';

definePageMeta({ layout: 'default' })
const { $swal } = useNuxtApp() as any

const {
    list,
    loading,
    pagesList,
    fetch
} = useCrud<Document>('invoice-received', { take: 10 })

const dialogDetail: any = reactive({
    source: null,
    show: false
})

const numberFormat = (number: number) => {
    return (number || "")
    .toString()
    .replace(/^0|\./g, "")
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}
const priceFormat = (number: number) => {
    return number ? `$ ${numberFormat(number)}` : `$ 0`;
}

function blobToBase64(blob: Blob) {
    return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
    });
}

const invoice: Ref<Document | undefined> = ref()
    
const viewDetail = async (item: Document) => {
    invoice.value = item;
    const result = await axios.get(`/invoice/${item.document_id}/pdf`, {
        responseType: 'blob', // Important to handle binary data
    })

    dialogDetail.source = await blobToBase64(result.data)
    dialogDetail.show = true;
  
}

const accept = async (item: Document) => {
    invoice.value = item;
    const result = await axios.post(`/document/accept`, {
        documents: [
            item.document_id
        ]
    })

    invoice.value = { ...invoice.value, status: 'ACCEPT'}
}

const reject = async (item: Document) => {
    invoice.value = item;
    const result = await axios.get(`/document/reject`, {
        responseType: 'blob', // Important to handle binary data
    })

    dialogDetail.source = await blobToBase64(result.data)
    dialogDetail.show = true;
  
}

</script>
<template>
    <div
      v-show="dialogDetail.show"
      class="fixed w-full h-screen left-0 top-0 z-10 flex flex-wrap justify-center content-center p-24"
    >
    <div
        v-show="dialogDetail.show"
        class="fixed glass w-full h-screen left-0 top-0 z-0" @click="dialogDetail.show = false"
        enter-active-class="transition ease-out duration-100"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-end-class="opacity-0"
      ></div>
      <div
        v-show="dialogDetail.show"
        class="w-full rounded bg-white shadow-xl z-10"
        enter-active-class="transition ease-out duration-100"
        enter-from-class="opacity-0 transform scale-90"
        enter-to-class="opacity-100 transform scale-100"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100 transform scale-100"
        leave-end-class="opacity-0 transform scale-90"
      >
      <div class="fixed bottom-[20px] right-[150px] ">
          <button class="bg-cyan-500 text-white text-lg px-4 py-3 rounded-2xl w-[200px] focus:outline-non" @click="invoice && accept(invoice)" v-if="invoice?.status=='PENDING'">Accept</button>
          <button class="bg-red-500 mx-2 text-white text-lg px-4 py-3 rounded-2xl w-[200px] focus:outline-non" @click="invoice && reject(invoice)" v-if="invoice?.status=='PENDING'">Reject</button>
        </div>
        <embed width="100%" height="700" :src="dialogDetail.source">
      </div>
    </div>
    <div class="overflow-x-scroll h-[100vh] pt-[40px] px-[20px]" >
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-[20px]">Document Received</h5>
    
    <div class="relative w-full p-4 text-center bg-white border border-gray-200 rounded-lg shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th scope="col" class="px-6 py-3">
                        Document Number
                    </th>
                    <th scope="col" class="px-6 py-3">
                        Sender name
                    </th>
                    <th scope="col" class="px-6 py-3">
                        Amount
                    </th>
                    <th scope="col" class="px-6 py-3">
                        Issue date
                    </th>
                    <th></th>
                </tr>
            </thead>
            
            <tbody>
                
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                 v-for="item in list.data"
                 v-if="! loading"
                >
                    <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {{ item.document_number }}
                    </th>
                    <td class="px-6 py-4">
                        {{ item.supplier_company_name_en }}
                    </td>
                    <td class="px-6 py-4">
                        {{  priceFormat(item.tax_inclusive_amount as number) }}
                    </td>
                    <td class="px-6 py-4">
                        {{ item.issue_date }}
                    </td>
                    <td>
                        <button class="btn btn-dark mr-2" @click="viewDetail(item)">
                            View invoice
                        </button>
        
                    </td>
                </tr>
               
            </tbody>
        </table>
        <div class="flex items-center justify-center w-full h-[300px] bg-gray-50" v-if="loading">
            <div role="status">
                <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    </div>

    </div>
</template>