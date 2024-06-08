import axios from "~/lib/axios";
import type { PaginationParam } from "~/types/Model";
import type { Pagination } from "~/types/Response";

export const useCrud = <T>(url: string, params: PaginationParam = { take: 10 }) => {
  const list = ref<Pagination<T>>({
    data: []
  });
  const loading = ref(false);
  const pagesList = ref<number[]>([])

  onMounted(async () => {
    loading.value = true;

    fetch(1)
  });

  const fetch = async (page: number, params = { }) => {
    loading.value = true
    const result: any = await axios.get(url, { params: {
        page: page,
        ...params
    } })
  
      loading.value = false;
      list.value = result.data;
  }

  const remove = async (id: number) => {
     return axios.delete(url + '/' + id)
  }

  const create = async (data: Partial<T>) => {
    return axios.post(url, data)
  }

  const update = async (id: number, data: Partial<T>) => {
    return axios.put(url + '/' + id, data)
  }

  return {
    remove,
    create,
    update,
    list,
    loading,
    pagesList,
    fetch
  };
};
