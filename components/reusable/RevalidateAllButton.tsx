'use client'

import Button from '@/components/reusable/Button'
import revalidateAll from '@/lib/revalidateAll'
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'


const RevalidateAllButton = () => {
  
  return (
    <Button color='danger' icon={<ExclamationTriangleIcon/>} onClick={() => revalidateAll()}>
      REVALIDATE ALL
    </Button>
  )
}

export default RevalidateAllButton