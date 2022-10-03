import React from 'react'
import fetch from 'cross-fetch'
import {Badge, ListItem, Divider, UnorderedList} from '@chakra-ui/react'
import Link from '../../components/link'

const ContentSearch = (props) => {
    if (!props.contentResult) {
        return <div>Loading...</div>
    }
    const {hits = []} = props.contentResult
    return (
        <div>
            {hits.length ? (
                <UnorderedList>
                    {hits.map(({id, name}) => (
                        <>
                            <Link key={id} to={`/content/${id}`}>
                                <ListItem>
                                    <Badge colorScheme="purple">{name}</Badge>
                                </ListItem>
                            </Link>
                            <Divider />
                            <Divider />
                            <Divider />
                            <Divider />
                            <Divider />
                            <Divider />
                        </>
                    ))}
                </UnorderedList>
            ) : (
                <div>No Content Items Found!</div>
            )}
        </div>
    )
}

ContentSearch.getProps = async () => {
    let contentResult
    var headers = {}
    headers['Authorization'] = 'Bearer d0232f78-cc0b-433f-ad2e-494a3fdb53c6'
    headers['Content-Type'] = 'application/json'
    const res2 = await fetch(
        `http://localhost:3000/mobify/proxy/ocapi/s/-/dw/data/v22_6/sites/RefArch/site_preferences/preference_groups/paypalTokens/sandbox`,
        {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({c_RedirectURL: 'Hello World123'})
        }
    )
    if (res2.ok) {
        console.log('Response Success')
        var contentResult2 = await res2.json()
        console.log(contentResult2)
    } else {
        console.log('error 4')
    }
    // var urlencoded = new URLSearchParams()
    // urlencoded.append(
    //     'grant_type',
    //     'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
    // )
    // const res = await fetch(
    //     `http://localhost:3000/mobify/proxy/ocapi/dw/oauth2/access_token?client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
    //     {
    //         method: 'POST',
    //         headers: {
    //             Authorization:
    //                 'Basic bml0aXNoQGN5bnRleGEuY29tOmNvbW1lcmNlMTIzNDU6YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh'
    //         },
    //         body: urlencoded
    //     }
    // )
    // if (res.ok) {
    //     contentResult = await res.json()
    //     var accessToken = contentResult.access_token
    //     console.log('access token =' + accessToken)
    //     const res1 = await fetch(
    //         `http://localhost:3000/mobify/proxy/ocapi/s/-/dw/data/v22_6/sites/RefArch/site_preferences/preference_groups/paypalTokens/sandbox`,
    //         {method: 'GET', headers: {Authorization: 'Bearer ' + accessToken}}
    //     )
    //     if (res1.ok) {
    //         console.log('after json2--------------------------------------------------')
    //         var contentResult1 = await res1.json()
    //         console.log(contentResult1)
    //     }
    // }

    // const res = await fetch(
    //     `http://localhost:3000/mobify/proxy/ocapi/s/-/dw/data/v22_6/sites/RefArch/site_preferences/preference_groups/paypalTokens/sandbox`,
    //     {method: 'GET', headers: {Authorization: 'Bearer 0595cb16-0c4d-4ba5-a982-e795bf0aeea0'}}
    // )
    // if (res.ok) {
    //     // console.log(res)
    //     console.log('after json---------------------')
    //     contentResult = await res.json()
    //     console.log(contentResult)
    // }
    if (process.env.NODE_ENV !== 'production') {
        console.log('Content result 1 --------------------')
        // console.log(contentResult)
    }
    return {contentResult}
}

ContentSearch.getTemplateName = () => 'content-search'

export default ContentSearch
