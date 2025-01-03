#!/bin/bash

source <(grep -v '^#' .env | sed '/^\s*$/d')
