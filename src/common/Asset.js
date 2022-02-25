import axios from "axios";
import { axisBottom } from "d3-axis";

let URL = process.env.NODE_ENV==='development'?"http://localhost:3001/asset":"https://ciobrainapi.azurewebsites.net/asset"
let applicationAssetURL = URL + '/application'
let dataAssetURL = URL + '/data'
let infrastructureAssetURL = URL + '/infrastructure'
let peopleAssetURL = URL + '/people'
let projectsAssetURL = URL + '/projects'
let businessAssetURL = URL + '/business'

export async function getApplicationAssetById(id) {
  try {
    const response = await axios.get( applicationAssetURL + '/' + id);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getDataAssetById(id) {
  try {
    const response = await axios.get( dataAssetURL + '/' + id);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getInfrastructureAssetById(id) {
  try {
    const response = await axios.get( infrastructureAssetURL + '/' + id);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getPeopleAssetById(id) {
  try {
    const response = await axios.get( peopleAssetURL + '/' + id);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getProjectsAssetById(id) {
  try {
    const response = await axios.get( projectsAssetURL + '/' + id);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getBusinessAssetById(id) {
  try {
    const response = await axios.get( businessAssetURL + '/' + id);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getAllApplicationAssets(id) {
  try {
    console.log("PROCESS ENVIRONMENT: " + process.env.NODE_ENV);
    const response = await axios.get( applicationAssetURL );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getAllDataAssets(id) {
  try {
    const response = await axios.get( dataAssetURL );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}


export async function getAllInfrastructureAssets(id) {
  try {
    const response = await axios.get( infrastructureAssetURL );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getAllPeopleAssets(id) {
  try {
    const response = await axios.get( peopleAssetURL );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getAllProjectsAssets(id) {
  try {
    const response = await axios.get( projectsAssetURL );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getAllBusinessAssets(id) {
  try {
    const response = await axios.get( businessAssetURL );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getApplicationAssetChildrenById(id) {
  try {
    const response = await axios.get( applicationAssetURL + '/' + id + '/children');
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getDataAssetChildrenById(id) {
  try {
    const response = await axios.get( dataAssetURL + '/' + id + '/children');
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getInfrastructureAssetChildrenById(id) {
  try {
    const response = await axios.get( infrastructureAssetURL + '/' + id + '/children');
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getPeopleAssetChildrenById(id) {
  try {
    const response = await axios.get( peopleAssetURL + '/' + id + '/children');
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getProjectsAssetChildrenById(id) {
  try {
    const response = await axios.get( projectsAssetURL + '/' + id + '/children');
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getBusinessAssetChildrenById(id) {
  try {
    const response = await axios.get( businessAssetURL + '/' + id + '/children');
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
