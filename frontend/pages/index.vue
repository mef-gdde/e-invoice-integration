<script setup lang="ts">
import axios from '~/lib/axios';
import type { CartItem, Product } from '~/types/Model';

const { $swal } = useNuxtApp() as any;

definePageMeta({ layout: 'default' })

const {
    list,
    loading,
    pagesList,
    fetch
} = useCrud<Product>('product', { take: 100})

const cart = ref<CartItem[]>([])
const dialogDetail: any = reactive({
    source: null,
    show: false
})
const search = ref('')
const findCartIndex = (product: Product) => {
    return cart.value.findIndex((cartItem) => cartItem.product.id === product.id);
}
const addToCart = (product: Product) => {
    const index = findCartIndex(product);
      if (index === -1) {
        cart.value.push({
          product: product,
          quantity: 1,
        });
      } else {
        cart.value[index].quantity += 1;
      }
}

const firstTime = ref()

onMounted(() => {
    firstTime.value = localStorage.getItem("first_time") === null
})

const submitable = () => buyer_vatin.value && cart.value.length > 0;

const activeMenu = 'pos'

const filteredProducts = computed(() => {
    if (search.value) {
        return list.value?.data.filter((product) => {
            return product.name.toLocaleLowerCase().indexOf(search.value.toLocaleLowerCase()) > -1
        })
    } else {
        return list.value?.data
    }
})

const clear = () => cart.value = []

const addQuantity = (CartItem: CartItem, quantity: number) => {
    CartItem.quantity += quantity
}

const products = computed(() => list.value?.data)
const numberFormat = (number: number) => {
    return (number || "")
      .toString()
      .replace(/^0|\./g, "")
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
}
const priceFormat = (number: number) => {
    return number ? `$ ${numberFormat(number)}` : `$ 0`;
}

const itemCounts = computed(() => {
    return cart.value.reduce((count: number, item: CartItem) => count + item.quantity, 0);
})

const totalPrice = computed(() => {
    return cart.value.reduce((total: number, item: CartItem) => total + (item.product.price * item.quantity), 0);
})

const buyer_vatin = ref('123456789-4333')
const cash = ref(0)

const addCash = (money: number) => {
    cash.value += money
}

const dateFormat = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('id', { dateStyle: 'short', timeStyle: 'short'});
    return formatter.format(date);
}
const submit = () => {
    console.log(cart.value)
    modalReceipt.show = true
    const time = new Date();
    modalReceipt.receiptNo = `TWPOS-KS-${Math.round(time.getTime() / 1000)}`;
    modalReceipt.receiptDate = dateFormat(time);
}

const moneys = [2000, 5000, 10000, 20000, 50000, 100000]

const change = computed(() => cash.value - totalPrice.value)

const modalReceipt = reactive({
    show: false,
    receiptNo: '',
    receiptDate: ''
})

const tax = computed(() => {
  return 0.1 * cart.value.reduce((sum, cartItem) => {
    return sum + cartItem.product.price * cartItem.quantity;
  }, 0)
})
const invoice: any = ref(null)
const printAndProceed = async () => {
      const data = {
        buyer_vat_tin: buyer_vatin.value,
        currency: 'USD',
        invoice_lines: cart.value.map((item: CartItem) => {
          return {
            id: item.product.id,
            quantity: item.quantity
          }
        })
      }
      try {
        const result = await axios.post('/invoice',  data);
        console.log(result.data)
        modalReceipt.show = false
        invoice.value = result.data
        viewDocument(result.data)
      } catch (e) {
        console.log(e)
      }
      clear();
    }

    function blobToBase64(blob: Blob) {
      return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
    
    const sendDocument = async () => {
      await axios.post(`/invoice/${invoice.value.invoice_id}/send`)

        $swal.fire({
            title: 'Document was sent',
            text: `Document ${invoice.value.invoice_id} has been sent`,
            icon: 'success',
        })

        dialogDetail.show = false
    }
    const viewDocument = async (item: any) => {
      const result = await axios.get(`invoice/${item.document_id}/pdf`, {
          responseType: 'blob', // Important to handle binary data
      })

      dialogDetail.source = await blobToBase64(result.data)
      console.log(222)
      dialogDetail.show = true;
    }
</script>

<template>
    <div class="hide-print flex flex-row h-screen antialiased text-blue-gray-800">
    <div class="flex-grow flex">
      <div class="flex flex-col bg-blue-gray-50 h-full w-full py-4">
        <div class="flex px-2 flex-row relative">
          <div class="absolute left-5 top-3 px-2 py-2 rounded-full bg-cyan-500 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            class="bg-white rounded-3xl shadow text-lg full w-full h-16 py-4 pl-16 transition-shadow focus:shadow-2xl focus:outline-none"
            placeholder="Cari menu ..."
            v-model="search"
          />
        </div>
        <div class="flex items-center justify-center w-full h-full bg-gray-50" v-if="loading">
            <div role="status">
                <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <div class="h-full overflow-hidden mt-4" v-if="!loading">
          <div class="h-full overflow-y-auto px-2">
            <div
              class="select-none bg-blue-gray-100 rounded-3xl flex flex-wrap content-center justify-center h-full opacity-25"
              v-show="products?.length === 0"
            >
              <div class="w-full text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <p class="text-xl">
                  YOU DON'T HAVE
                  <br/>
                  ANY PRODUCTS TO SHOW
                </p>
              </div>
            </div>
            <div
              class="select-none bg-blue-gray-100 rounded-3xl flex flex-wrap content-center justify-center h-full opacity-25"
              v-show="filteredProducts?.length === 0 && search?.length > 0"
            >
              <div class="w-full text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p class="text-xl">
                  EMPTY SEARCH RESULT
                  <br/>
                  "<span class="font-semibold">{{ search }}</span>"
                </p>
              </div>
            </div>
            <div v-show="filteredProducts?.length" class="grid grid-cols-4 gap-4 pb-3">
              <template v-for="product in filteredProducts" :key="product.id">
                <div
                  role="button"
                  class="select-none cursor-pointer transition-shadow overflow-hidden rounded-2xl bg-white shadow hover:shadow-lg"
                  :title="product.name"
                  @click="addToCart(product)"
                >
                  <img :src="product.image" :alt="product.name">
                  <div class="flex pb-3 px-3 text-sm mt-3">
                    <p class="flex-grow truncate mr-1">{{ product.name }}</p>
                    <p class="nowrap font-semibold">{{ priceFormat(product.price) }}</p>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <!-- end of store menu -->

      <!-- right sidebar -->
      <div class="w-5/12 flex flex-col bg-blue-gray-50 h-full bg-white pr-4 pl-2 py-4">
        
        <div class="bg-white rounded-3xl flex flex-col h-full shadow">
          <!-- empty cart -->
          <div v-show="cart.length === 0" class="flex-1 w-full p-4 opacity-25 select-none flex flex-col flex-wrap content-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>
              CART EMPTY
            </p>
          </div>

          <!-- cart items -->
          <div v-show="cart.length > 0" class="flex-1 flex flex-col overflow-auto">
            <div class="h-16 text-center flex justify-center">
              <div class="pl-8 text-left text-lg py-4 relative">
                <!-- cart icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div v-show="itemCounts > 0" class="text-center absolute bg-cyan-500 text-white w-5 h-5 text-xs p-0 leading-5 rounded-full -right-2 top-3">{{ itemCounts }}</div>
              </div>
              <div class="flex-grow px-8 text-right text-lg py-4 relative">
                <!-- trash button -->
                <button @click="clear()" class="text-blue-gray-300 hover:text-pink-500 focus:outline-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex-1 w-full px-4 overflow-auto">
              <template v-for="item in cart" :key="item.productId">
                <div class="select-none mb-3 bg-blue-gray-50 rounded-lg w-full text-blue-gray-700 py-2 px-2 flex justify-center">
                  <img :src="item.product.image" alt="" class="rounded-lg h-10 w-10 bg-white shadow mr-2">
                  <div class="flex-grow">
                    <h5 class="text-sm">{{ item?.product?.name }}</h5>
                    <p class="text-xs block">{{ priceFormat(item.product.price) }}</p>
                  </div>
                  <div class="py-1">
                    <div class="w-28 grid grid-cols-3 gap-2 ml-2">
                      <button @click="addQuantity(item, -1)" class="rounded-lg text-center py-1 text-white bg-red-600 hover:bg-blue-gray-700 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <input v-model="item.quantity" type="text" class="bg-white rounded-lg text-center shadow focus:outline-none focus:shadow-lg text-sm">
                      <button @click="addQuantity(item, 1)" class="rounded-lg text-center py-1 text-white bg-blue-600 hover:bg-blue-gray-700 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <!-- end of cart items -->

          <!-- payment info -->
          <div class="select-none h-auto w-full text-center pt-3 pb-4 px-4">
            <div class="flex mb-3 text-lg font-semibold text-blue-gray-700">
              <div>TOTAL</div>
              <div class="text-right w-full">{{ priceFormat(totalPrice) }}</div>
            </div>
           
            <!-- <div
              v-show="change < 0"
              class="flex mb-3 text-lg font-semibold bg-pink-100 text-blue-gray-700 rounded-lg py-2 px-3"
            >
              <div
                class="text-right flex-grow text-pink-600"
                >{{ priceFormat(change) }}
              </div>
            </div> -->
            <div
              v-show="change == 0 && cart.length > 0"
              class="flex justify-center mb-3 text-lg font-semibold bg-cyan-50 text-cyan-700 rounded-lg py-2 px-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <button
              class="text-white rounded-2xl text-lg w-full py-3 focus:outline-none"
              :class="{
                'bg-cyan-500 hover:bg-cyan-600': submitable(),
                'bg-blue-gray-200': !submitable()
              }"
              :disabled="!submitable()"
              @click="submit()"
            >
              SUBMIT
            </button>
          </div>
          <!-- end of payment info -->
        </div>
      </div>
      <!-- end of right sidebar -->
    </div>
    <!-- modal receipt -->
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
        <embed width="100%" height="800" :src="dialogDetail.source">
      </div>
    </div>
    <div
      v-show="modalReceipt.show"
      class="fixed w-full h-screen left-0 top-0 z-10 flex flex-wrap justify-center content-center p-24"
    >
      <div
        v-show="modalReceipt.show"
        class="fixed glass w-full h-screen left-0 top-0 z-0" @click="modalReceipt.show = false"
        enter-active-class="transition ease-out duration-100"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-end-class="opacity-0"
      ></div>
      <div
        v-show="modalReceipt.show"
        class="w-96 rounded-3xl bg-white shadow-xl overflow-hidden z-10"
        enter-active-class="transition ease-out duration-100"
        enter-from-class="opacity-0 transform scale-90"
        enter-to-class="opacity-100 transform scale-100"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100 transform scale-100"
        leave-end-class="opacity-0 transform scale-90"
      >
        <div id="receipt-content" class="text-left w-full text-sm p-6 overflow-auto">
          <div class="text-center">
            <!-- <img src="img/receipt-logo.png" alt="Tailwind POS" class="mb-3 w-8 h-8 inline-block"> -->
            <h2 class="text-xl font-semibold">APPLE Store POS</h2>
            <p>CABANG KONOHA SELATAN</p>
          </div>
          <div class="flex mt-4 text-xs">
            <div class="flex-grow">No: <span>{{ modalReceipt.receiptNo }}</span></div>
            <div>{{ modalReceipt.receiptDate }}</div>
          </div>
          <hr class="my-2">
          <div>
            <table class="w-full text-xs">
              <thead>
                <tr>
                  <th class="py-1 w-1/12 text-center">#</th>
                  <th class="py-1 text-left">Item</th>
                  <th class="py-1 w-2/12 text-center">Qty</th>
                  <th class="py-1 w-3/12 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, index) in cart" :key="item">
                  <tr>
                    <td class="py-2 text-center">{{ index + 1 }}</td>
                    <td class="py-2 text-left">
                      <span>{{ item.product.name }}</span>
                      <br/>
                      <small>{{ priceFormat(item.product.price) }}</small>
                    </td>
                    <td class="py-2 text-center">{{ item.quantity }}</td>
                    <td class="py-2 text-right">{{ priceFormat(item.quantity * item.product.price) }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <hr class="my-2">
          <div>
            <div class="flex font-semibold">
              <div class="flex-grow">Subtotal</div>
              <div>{{ priceFormat(totalPrice) }}</div>
            </div>
            <div class="flex font-semibold">
              <div class="flex-grow">Tax</div>
              <div>{{ priceFormat(tax) }}</div>
            </div>
            <div class="flex font-semibold">
              <div class="flex-grow">Total</div>
              <div>{{ priceFormat(totalPrice + tax) }}</div>
            </div>
            <!-- <div class="flex text-xs font-semibold">
              <div class="flex-grow">PAY AMOUNT</div>
              <div>{{ priceFormat(cash) }}</div>
            </div>
            <hr class="my-2">
            <div class="flex text-xs font-semibold">
              <div class="flex-grow">CHANGE</div>
              <div>{{ priceFormat(change) }}</div>
            </div> -->
          </div>
        </div>
        <div class="p-4 w-full">
          <button class="bg-cyan-500 text-white text-lg px-4 py-3 rounded-2xl w-full focus:outline-none" @click="printAndProceed()">PROCEED</button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>

.glass {
  background-color: rgba(100, 120, 130, .6);
  backdrop-filter: blur(10px);
}

table td {
  vertical-align: top;
}

#receipt-content {
  max-height: 70vh;
}

@media print {
  .hide-print {
    display: none !important;
  }
  .print-area {
    display: block;
  }
}
</style>