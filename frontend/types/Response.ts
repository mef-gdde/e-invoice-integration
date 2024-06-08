export interface Response<T> {
    data: Pagination<T>,
}

export interface Pagination<T> {
    data: T[],
    pagination?: {
        page: number,
        size: number,
        total_counts: number,
        total_pages: number
    }
}