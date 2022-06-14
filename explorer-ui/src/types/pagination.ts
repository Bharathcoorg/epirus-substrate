
export interface PageQuery {
  first: number,
  after?: string,
  orderBy?: string
}

export interface Edge<T> {
    node: T
  }

export interface Page<T> {
    totalCount: number
    edges: Edge<T>[]
    pageInfo: {
      hasNextPage: Boolean
      hasPreviousPage: Boolean
      startCursor: string
      endCursor: string
    }
  }