"use client"
import React, { useState } from 'react'
import ViewCustomer from './viewCustomer'
import BreadCrum from '@/components/custom-components/bread-crum'

const Customer = () => {
    return (
        <div className='container p-6'>
            <BreadCrum mainfolder="Customer" subfolder="List Customers" />
            <ViewCustomer />
        </div>
    )
}

export default Customer