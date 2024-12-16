"use client"
import React, { useState } from 'react'
import ViewCustomer from './viewCustomer'
import BreadCrum from '@/components/custom-components/bread-crum'
import CreateCustomerModel from '../pos/create-customer-model'

const Customer = () => {
    return (
        <div className='container p-6'>
            <BreadCrum mainfolder="Customer" subfolder="List Customers" />
            <ViewCustomer />
        </div>
    )
}

export default Customer